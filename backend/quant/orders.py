import os
from dotenv import load_dotenv
from binance.client import Client
from binance.exceptions import BinanceAPIException

load_dotenv()

class Order: 
    def __init__(self):
        self.client = Client(
        api_key=os.getenv('BINANCE_TESTNET_API'),
        api_secret=os.getenv('BINANCE_TESTNET_SECRET'),
        testnet=True
        )
        
    def get_balance(self) -> float:
        balances = self.client.futures_account_balance()
        usdt = next((item for item in balances if item["asset"] == "USDT"), None)
        if not usdt:
            raise Exception("No USDT balance found on testnet")
        return float(usdt["balance"])

    def cancel_all_orders(self, symbol: str):
        try:
            orders = self.client.futures_get_open_orders(symbol=symbol)
            for o in orders:
                self.client.futures_cancel_order(symbol=symbol, orderId=o["orderId"])
            if orders:
                print(f"  Cancelled {len(orders)} existing open order(s)")
        except BinanceAPIException as e:
            print(f"  [WARN] Cancel orders failed: {e}")

    def set_leverage(self, symbol: str, leverage: int):
        try:
            self.client.futures_change_leverage(symbol=symbol, leverage=leverage)
        except BinanceAPIException as e:
            print(f"  [WARN] Leverage: {e}")

    def place_entry(self, symbol: str, direction: str, quantity: float) -> dict:
        side = "SELL" if direction == "short" else "BUY"
        return self.client.futures_create_order(
            symbol=symbol,
            side=side,
            type="MARKET",
            quantity=quantity
        )

    def place_sl(self, symbol: str, direction: str, stop_price: float, quantity: float) -> dict:
        side = "BUY" if direction == "short" else "SELL"
        return self.client.futures_create_order(
            symbol=symbol,
            side=side,
            type="STOP_MARKET",
            stopPrice=round(stop_price, 2),
            quantity=quantity,
            reduceOnly=True,
            workingType="MARK_PRICE",
            priceProtect="TRUE",
        )

    def place_tp(self, symbol: str, direction: str, tp_price: float, quantity: float) -> dict:
        side = "BUY" if direction == "short" else "SELL"
        return self.client.futures_create_order(
            symbol=symbol,
            side=side,
            type="TAKE_PROFIT_MARKET",
            stopPrice=round(tp_price, 2),
            quantity=quantity,
            reduceOnly=True,
            workingType="MARK_PRICE",
            priceProtect="TRUE",
        )
    
    