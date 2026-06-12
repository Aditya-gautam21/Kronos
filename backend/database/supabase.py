import os 
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone
from supabase import create_async_client
from backend.quant.executed_trades import ExecutedTrades

load_dotenv()
_client = None

async def get_client():
    global _client
    if _client is None:
        _client = await create_async_client(
            supabase_url=os.getenv('SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_SECRET_ROLE_KEY')
        )
    return _client

class Database:
    def __init__(self, trade_data: dict):
        self.trade_data = trade_data

    async def trades(self):
        self.trade_id = str(uuid.uuid4())

        trade = {
            'trade_id': self.trade_id,
            'symbol': self.trade_data['initial_trade_info']['symbol'],
            'direction': self.trade_data['initial_trade_info']['direction'],
            'confidence': self.trade_data['initial_trade_info']['confidence'],
            'entry_order_id': self.trade_data['orders']['entry']['orderId'],
            'entry_price': self.trade_data['initial_trade_info']['entry_price'],
            'quantity': self.trade_data['position_size']['margin_usdt'],
            'leverage': self.trade_data['position_size']['leverage'],
            'sl_price': self.trade_data['initial_trade_info']['stop_loss'],
            'sl_order_id': self.trade_data['orders']['stop_loss']['algoId'],
            'tp_price': self.trade_data['initial_trade_info']['take_profit'],
            'tp_order_id': self.trade_data['orders']['take_profit']['algoId'],
            'opened_at': datetime.now(timezone.utc).isoformat()
        }

        client = await get_client()
        return await client.table("trades").insert(trade).execute()

    async def trade_raw_data(self):
        raw_data = {
            'trade_id': self.trade_id,
            'llm_output': self.trade_data,
            'recorded_at': datetime.now(timezone.utc).isoformat()
        }

        client = await get_client()
        return await client.table('trade_raw_data').insert(raw_data).execute()

    async def trade_results(self):
        executed = await ExecutedTrades().executed_trade_data()
        if executed is None:
            return None  # no closed trades yet — nothing to record

        results = {
            'trade_id': self.trade_id,
            'exit_order_id': None,
            'exit_price': executed['trade']['price'],
            'exit_reason': executed['exit_reason'],
            'gross_pnl': executed['trade']['realizedPnl'],
            'trading_fees': executed['trade']['commission'],
            'total_funding_fees': None,
            'net_pnl': executed['net_pnl'],
            'holding_duration': None,
            'funding_periods': None,
            'recorded_at': datetime.now(timezone.utc).isoformat()
        }

        client = await get_client()
        return await client.table("trade_results").insert(results).execute()