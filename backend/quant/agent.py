from datetime import datetime, timezone
from backend.utils.extract_json import extract_json
from backend.researcher.agent import ResearchAgent
from backend.deepseek_llm import get_deepseek_llm
from backend.quant.kelly import kelly_position_size
from backend.quant.orders import Order
from binance.exceptions import BinanceAPIException
from backend.database.supabase import Database
from backend.state import load_state, save_state, add_log

class QuantAgent:
    def __init__(self):
        self.order = Order()

    def kelly_sizing(self, trade, max_budget=None):
        balance = self.order.get_balance()
        if max_budget is not None:
            balance = min(balance, max_budget)
        sizing = kelly_position_size(confidence=trade["confidence"],
            direction=trade["direction"],
            entry_price=trade["entry_price"],
            stop_loss=trade["stop_loss"],
            take_profit=trade["take_profit"],
            balance=balance,
            leverage=trade["leverage"])

        return sizing

    def generate_trade(self, symbol, max_budget=None) -> tuple[dict, dict]:
        researcher = ResearchAgent()
        research_output = researcher.research(symbol)
        trade = extract_json(research_output)

        state = load_state()
        backtest_item = {
            "id": f"bt-{symbol}-{int(datetime.now(timezone.utc).timestamp())}",
            "time": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "desc": f"Calculating Kelly Criterion sizing for {symbol}."
        }
        state.setdefault("pipeline", {}).setdefault("backtest", []).append(backtest_item)
        state["pipeline"]["backtest"] = state["pipeline"]["backtest"][-5:]
        save_state(state)

        if trade.get("edge_found"):
            position_size = self.kelly_sizing(trade, max_budget)
        else:
            position_size = {}
        return trade, position_size
    
    def execute(self, symbol, max_budget=None) -> dict:
        trade, position_size = self.generate_trade(symbol, max_budget)

        state = load_state()
        risk_item = {
            "id": f"risk-{symbol}-{int(datetime.now(timezone.utc).timestamp())}",
            "time": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "desc": f"Validating risk limits for {symbol}: {trade.get('direction', 'UNKNOWN')} trade."
        }
        state.setdefault("pipeline", {}).setdefault("risk_review", []).append(risk_item)
        state["pipeline"]["risk_review"] = state["pipeline"]["risk_review"][-5:]
        save_state(state)

        if not trade or not trade.get("edge_found"):
            reason = (trade or {}).get("hypothesis", "No edge found")
            print(f"SKIP: {reason}")
            return {"status": "skipped", "reason": reason}

        balance = self.order.get_balance()
        print(f"Balance: ${balance:.2f}")

        qty = position_size.get("quantity")
        self.order.set_leverage(symbol, int(trade['leverage']))

        result = {"status": "executed", "initial_trade_info": trade, "position_size": position_size, "orders": {}}

        try:
            entry = self.order.place_entry(symbol=symbol, direction=trade["direction"], quantity=qty)
            result["orders"]["entry"] = entry
            print(f"ENTRY placed: {entry.get('orderId', 'OK')}")
        except BinanceAPIException as e:
            result["status"] = "failed"
            result["orders"]["entry"] = {"error": str(e)}
            print(f"ENTRY FAILED: {e}")
            return result

        try:
            sl = self.order.place_sl(symbol, trade["direction"], trade["stop_loss"], qty)
            result["orders"]["stop_loss"] = sl
            print(f"SL placed: {sl.get('orderId', 'OK')}")
        except BinanceAPIException as e:
            result["orders"]["stop_loss"] = {"error": str(e)}
            print(f"SL FAILED: {e}")

        try:
            tp = self.order.place_tp(symbol, trade["direction"], trade["take_profit"], qty)
            result["orders"]["take_profit"] = tp
            print(f"TP placed: {tp.get('orderId', 'OK')}")
        except BinanceAPIException as e:
            result["orders"]["take_profit"] = {"error": str(e)}
            print(f"TP FAILED: {e}")

        print("DONE — check testnet.binancefuture.com")
        add_log(agent="Quant", message=result, log_type="quant_output")
        return result
