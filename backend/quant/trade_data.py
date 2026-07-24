import os
from dotenv import load_dotenv
from binance.client import Client
from backend.quant.orders import Order

load_dotenv()
_client = None

def get_binance_client():
    global _client
    if _client is None:
        _client = Client(
            api_key=os.getenv("BINANCE_TESTNET_API"),
            api_secret=os.getenv("BINANCE_TESTNET_SECRET"),
            testnet=True
        )
    return _client

class ExecutedTrades:
    def __init__(self):
        self.order = Order()

    async def check_orders(self, sl_id, tp_id, trade_id, orderId, symbol):
        client = get_binance_client()
        try:
                sl_order = client.futures_get_algo_order(symbol=symbol, algoId = sl_id)
                tp_order = client.futures_get_algo_order(symbol=symbol, algoId = tp_id)

                TERMINAL = {'FINISHED', 'CANCELED', 'EXPIRED', 'REJECTED'}
                if sl_order['algoStatus'] in TERMINAL:
                    trades = client.futures_account_trades(symbol=symbol)
                    closing_trade = next((t for t in trades if float(t['realizedPnl']) != 0), trades[0])
                    net_pnl = float(closing_trade['realizedPnl']) - float(closing_trade['commission'])

                    self.order.cancel_all_orders(symbol= symbol)
                    return {'exit_reason': sl_order['orderType'], 'trade': closing_trade, 'net_pnl': net_pnl, 'trade_id': trade_id}

                if tp_order['algoStatus'] in TERMINAL:
                    trades = client.futures_account_trades(symbol=symbol)
                    closing_trade = next((t for t in trades if float(t['realizedPnl']) != 0), trades[0])
                    net_pnl = float(closing_trade['realizedPnl']) - float(closing_trade['commission'])

                    self.order.cancel_all_orders(symbol= symbol)
                    return {'exit_reason': tp_order['orderType'], 'trade': closing_trade, 'net_pnl': net_pnl, 'trade_id': trade_id}
        except Exception as e:
            print(e)
    
    def live_data(self):
        client = get_binance_client()
        data = client.futures_()
        print(data)

if __name__ == '__main__':
    ExecutedTrades().live_data()
