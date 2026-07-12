from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio

from backend.state import load_state, add_log
from backend.quant.agent import QuantAgent
from backend.database.supabase import Database
from backend.researcher.binance import BINANCE

class TradeOrchestration:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._maximum_trades = 7
        self._open_trades = 0
        self.db = Database()
        self.open_trades_symbol = []
        self.binance = BINANCE()

    async def place_trades(self):
        gainers = self.binance.get_top_gainers()

        if self._open_trades >= self._maximum_trades:
            return
        
        for item in gainers:
            symbol = item['symbol']

            if symbol not in self.open_trades_symbol:
                try:
                    trade = await asyncio.to_thread(QuantAgent().execute, symbol)

                    if trade["status"] == "executed":
                        trade_id = await self.db.trades(trade)
                        await self.db.trade_raw_data(trade, trade_id)

                        self.open_trades_symbol.append(symbol)
                        self._open_trades += 1

                        add_log(agent="Quant", message=f"{symbol}: Trade executed")
                except Exception as e:
                    print(e)
    
    async def close_trades(self):
        for symbol in list(self.open_trades_symbol):
            result = await self.db.trade_closed(symbol)

            if result:
                self._open_trades -= 1
                self.open_trades_symbol.remove(symbol)
                add_log(agent='Quant', message='Trade closed')
    
    async def _pipeline_wrapper(self):
        await self.place_trades()
        await self.close_trades()

    def start_scheduler(self):
        self.scheduler.add_job(
            func=self._pipeline_wrapper,
            trigger="interval",
            minutes=15,
            id='trader_pipeline'
        )
        self.scheduler.start()
