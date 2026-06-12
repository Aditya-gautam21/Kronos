import os
import json
import asyncio
from dotenv import load_dotenv
from binance.client import Client
from supabase import create_async_client
from backend.quant.orders import Order

load_dotenv()
_client = None
_supabase = None

def get_binance_client():
    global _client
    if _client is None:
        _client = Client(
            api_key=os.getenv("BINANCE_TESTNET_API"),
            api_secret=os.getenv("BINANCE_TESTNET_SECRET"),
            testnet=True
        )
    return _client

async def get_supabase_client():
    global _supabase
    if _supabase is None:
        _supabase = await create_async_client(
             supabase_url=os.getenv('SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_SECRET_ROLE_KEY')
        )
    return _supabase

class ExecutedTrades:
    def __init__(self):
        self.order = Order()

    async def executed_trade_data(self):
        client = get_binance_client()
        supabase = await get_supabase_client()
        table= supabase.table('trades')

        try:
            open_trades = (await table.select("trade_id, symbol, entry_order_id, sl_order_id, tp_order_id").eq('status', 'OPEN').execute()).data

            for row in open_trades:
                sl_id = row['sl_order_id']
                tp_id = row['tp_order_id']
                symbol = row['symbol']
                trade_id = row['trade_id']
                orderId = row['entry_order_id']

                sl_order = client.futures_get_algo_order(symbol=symbol, algoId = sl_id)
                tp_order = client.futures_get_algo_order(symbol=symbol, algoId = tp_id)
                
                TERMINAL = {'FINISHED', 'CANCELED', 'EXPIRED', 'REJECTED'}
                if sl_order['algoStatus'] in TERMINAL:
                    trade = client.futures_account_trades(symbol=symbol, orderId=orderId)
                    net_pnl = float(trade[0]['realizedPnl']) - float(trade[0]['commission'])

                    await table.update({'status': 'CLOSED'}).eq('trade_id', trade_id).execute()
                    self.order.cancel_all_orders(symbol= symbol)

                    return {'exit_reason':sl_order['orderType'], 'trade':trade, 'net_pnl': net_pnl}
                
                if tp_order['algoStatus'] in TERMINAL:
                    trade = client.futures_account_trades(symbol=symbol, orderId=orderId)
                    net_pnl = float(trade[0]['realizedPnl']) - float(trade[0]['commission'])

                    await table.update({'status': 'CLOSED'}).eq('trade_id', trade_id).execute()
                    self.order.cancel_all_orders(symbol= symbol)

                    return {'exit_reason':tp_order['orderType'], 'trade':trade, 'net_pnl': net_pnl}
        except Exception as e:
            print(e)
            raise
    
if __name__ == "__main__":
    asyncio.run(ExecutedTrades().executed_trade_data())