import os
from dotenv import load_dotenv
import uuid
from supabase import create_async_client
from backend.quant.trade_data import ExecutedTrades
from backend.state import now_ist
import asyncio

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
    async def _ensure_client(self):
        if not hasattr(self, '_client'):
            self._client = await get_client()
        return self._client

    async def trades(self, trade_data: dict):
        client = await self._ensure_client()
        trade_id = str(uuid.uuid4())

        trade = {
            'trade_id': trade_id,
            'symbol': trade_data['initial_trade_info']['symbol'],
            'direction': trade_data['initial_trade_info']['direction'],
            'confidence': trade_data['initial_trade_info']['confidence'],
            'entry_order_id': trade_data['orders']['entry']['orderId'],
            'entry_price': trade_data['initial_trade_info']['entry_price'],
            'quantity': trade_data['position_size']['margin_usdt'],
            'leverage': trade_data['position_size']['leverage'],
            'sl_price': trade_data['initial_trade_info']['stop_loss'],
            'sl_order_id': trade_data['orders']['stop_loss']['algoId'],
            'tp_price': trade_data['initial_trade_info']['take_profit'],
            'tp_order_id': trade_data['orders']['take_profit']['algoId'],
            'opened_at': now_ist().isoformat()
        }

        await client.table("trades").insert(trade).execute()
        return trade_id

    async def trade_raw_data(self, trade_data: dict, trade_id: str):
        client = await self._ensure_client()
        raw_data = {
            'trade_id': trade_id,
            'llm_output': trade_data,
            'recorded_at': now_ist().isoformat()
        }
        return await client.table('trade_raw_data').insert(raw_data).execute()

    async def trade_query(self, symbol):
        client = await self._ensure_client()
        open_trades = (await client.table('trades')
                       .select('entry_order_id, sl_order_id, tp_order_id, trade_id, symbol, direction, entry_price')
                       .eq('symbol', symbol)
                       .or_('status.is.null,status.neq.CLOSED')
                       .execute()).data

        if not open_trades:
            return None

        row = open_trades[0]
        return row['sl_order_id'], row['tp_order_id'], row['trade_id'], row['entry_order_id'], row['symbol'], row['direction'], row['entry_price']

    async def trade_closed(self, symbol):
        ids = await self.trade_query(symbol)
        if ids is None:
            return None

        sl_id, tp_id, trade_id, orderId, sym, direction, entry_price = ids
        executed = await ExecutedTrades().check_orders(sl_id, tp_id, trade_id, orderId, symbol)
        print(f'EXECUTED -> {executed}')

        if executed is None:
            return None

        client = await self._ensure_client()
        results = {
            'trade_id': executed['trade_id'],
            'exit_order_id': None,
            'exit_price': executed['trade']['price'],
            'exit_reason': executed['exit_reason'],
            'gross_pnl': executed['trade']['realizedPnl'],
            'trading_fees': executed['trade']['commission'],
            'total_funding_fees': None,
            'net_pnl': executed['net_pnl'],
            'holding_duration': None,
            'funding_periods': None,
            'recorded_at': now_ist().isoformat()
        }

        await client.table('trades').update({'status': 'CLOSED'}).eq('trade_id', executed['trade_id']).execute()
        await client.table("trade_results").insert(results).execute()

        # Return trade data for populating state.json trade_history
        return {
            'symbol': sym,
            'direction': direction,
            'entry_price': entry_price,
            'exit_price': executed['trade']['price'],
            'net_pnl': executed['net_pnl'],
            'exit_reason': executed['exit_reason'],
            'closed_at': now_ist().isoformat(),
        }
    
if __name__ =='__main__':
    asyncio.run(Database().trade_closed('DEXEUSDT'))
