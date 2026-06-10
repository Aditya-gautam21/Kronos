import os
import json
from dotenv import load_dotenv, find_dotenv
from binance.client import Client

load_dotenv()
_client = None

def get_client():
    global _client
    if _client is None:
        _client = Client(
            api_key=os.getenv("BINANCE_TESTNET_API"),
            api_secret=os.getenv("BINANCE_TESTNET_SECRET"),
            testnet=True
        )
    
    return _client

class ExecutedTrades:
    def executed_trade_data(self):
        client = get_client()

        trades = client.futures_recent_trades(symbol='ETHUSDT')

        with open ('recent_trades.json', 'w') as file:
            json.dump(trades, file)

if __name__ == "__main__":
    ExecutedTrades().executed_trade_data()
