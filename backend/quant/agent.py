import json
from backend.utils.extract_json import extract_json
from backend.researcher.agent import ResearchAgent
from backend.local_llm import get_llm
from backend.quant.kelly import kelly_position_size
from backend.quant.orders import Order
from binance.exceptions import BinanceAPIException

class QuantAgent:
    def __init__(self):
        get_llm()
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
        
    def generate_trade(self) -> tuple[dict, dict]:
        """Run research pipeline and return trade-ready JSON."""
        researcher = ResearchAgent()
        research_output = researcher.research()
        trade = extract_json(research_output)

        position_size = self.kelly_sizing(trade)
        return trade, position_size
    
    def execute(self) -> dict:
        trade, position_size = self.generate_trade()

        if not trade or not trade.get("edge_found"):
            reason = (trade or {}).get("hypothesis", "No edge found")
            print(f"SKIP: {reason}")
            return {"status": "skipped", "reason": reason}

        symbol = trade.get("symbol")

        balance = self.order.get_balance()
        print(f"Balance: ${balance:.2f}")

        qty = position_size.get("quantity")

        #print("--- Placing Orders ---")
        self.order.set_leverage(symbol, int(trade['leverage']))

        result = {"status": "executed", "initial_trade_info": trade, "position_size": position_size, "orders": {}}

        try:
            entry = self.order.place_entry(symbol=symbol, direction=trade.get("direction"), quantity=qty)
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
        return result
    
    def save_json(self):
        results = self.execute()

        with open ('trade.json', 'w+') as file:
            json.dump(results, file)

if __name__ == '__main__':
    QuantAgent().save_json()
    print("SUCCESSFUL")
