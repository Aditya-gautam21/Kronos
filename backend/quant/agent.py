from backend.utils.extract_json import extract_json
from backend.researcher.agent import ResearchAgent
from backend.deepseek_llm import get_deepseek_llm
from backend.quant.kelly import kelly_position_size
from backend.quant.orders import Order
from binance.exceptions import BinanceAPIException
from backend.database.supabase import Database
from backend.state import add_log

class QuantAgent:
    def __init__(self):
        self.order = Order()

    def kelly_sizing(self, trade):
        sizing = kelly_position_size(confidence=trade["confidence"],
            direction=trade["direction"],
            entry_price=trade["entry_price"],
            stop_loss=trade["stop_loss"],
            take_profit=trade["take_profit"],
            balance=self.order.get_balance(),
            leverage=trade["leverage"])
        
        return sizing
        
    def generate_trade(self, symbol) -> tuple[dict, dict]:
        researcher = ResearchAgent()
        research_output = researcher.research(symbol)
        trade = extract_json(research_output)

        position_size = self.kelly_sizing(trade)
        return trade, position_size
    
    def execute(self, symbol) -> dict:
        trade, position_size = self.generate_trade(symbol)

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
