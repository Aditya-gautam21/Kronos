from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import traceback
import uuid

from backend.state import load_state, save_state, add_log, now_ist
from backend.quant.agent import QuantAgent
from backend.database.supabase import Database
from backend.researcher.binance import BINANCE

class TradeOrchestration:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._maximum_trades = 3
        self._max_budget = 200.0
        self.db = Database()
        self.binance = BINANCE()

    def _active_positions(self):
        try:
            raw = self.binance.testnet_client.futures_position_information()
            return [p for p in raw if float(p.get("positionAmt", 0)) != 0]
        except Exception:
            return []

    async def place_trades(self):
        gainers = self.binance.get_top_gainers()
        active = self._active_positions()
        active_symbols = {p["symbol"] for p in active}

        if len(active) >= self._maximum_trades:
            add_log(agent="SYSTEM", message=f"Pipeline cycle skipped: {len(active)} open positions on Binance (max {self._maximum_trades}).", log_type="info")
            return

        for item in gainers:
            symbol = item['symbol']

            if symbol in active_symbols:
                continue

            if len(active_symbols) >= self._maximum_trades:
                add_log(agent="SYSTEM", message=f"Trade limit reached ({self._maximum_trades}). Stopping placement this cycle.", log_type="info")
                break

            try:
                trade = await asyncio.to_thread(QuantAgent().execute, symbol, self._max_budget)

                if trade["status"] == "executed":
                    trade_id = await self.db.trades(trade)
                    await self.db.trade_raw_data(trade, trade_id)
                    active_symbols.add(symbol)
                    add_log(agent="Quant", message=f"{symbol}: Trade executed")
            except Exception as e:
                print(e)

    async def close_trades(self):
        active = self._active_positions()
        active_symbols = {p["symbol"] for p in active}

        for symbol in list(active_symbols):
            result = await self.db.trade_closed(symbol)
            if result:
                state = load_state()
                history_entry = {
                    "id": str(uuid.uuid4()),
                    "symbol": result["symbol"],
                    "side": result["direction"].upper(),
                    "size": 0,
                    "entry_price": result["entry_price"],
                    "exit_price": result["exit_price"],
                    "pnl": result["net_pnl"],
                    "exit_reason": result["exit_reason"],
                    "status": "CLOSED",
                    "timestamp": result["closed_at"],
                }
                state["trade_history"].append(history_entry)
                if len(state["trade_history"]) > 500:
                    state["trade_history"] = state["trade_history"][-500:]
                save_state(state)
                add_log(agent='Quant', message=f'{symbol}: Trade closed — Net PnL: ${result["net_pnl"]:.2f}')
    
    async def _pipeline_wrapper(self):
        state = load_state()
        state["bot_runs"] = state.get("bot_runs", 0) + 1
        state["last_execution"] = now_ist().strftime("%Y-%m-%d %H:%M:%S IST")
        save_state(state)

        add_log(agent="SYSTEM", message=f"Pipeline execution cycle #{state['bot_runs']} started.")
        try:
            await self.place_trades()
            await self.close_trades()

            state = load_state()
            state["last_result"] = "Success"
            save_state(state)
            add_log(agent="SYSTEM", message=f"Pipeline execution cycle #{state['bot_runs']} completed successfully.")
        except Exception as e:
            state = load_state()
            state["last_result"] = f"Failed: {str(e)}"
            save_state(state)
            tb = traceback.format_exc()
            add_log(agent="SYSTEM", message=f"Pipeline execution cycle #{state['bot_runs']} failed: {str(e)}\n{tb}", log_type="error")

    def start_scheduler(self):
        self.scheduler.add_job(
            func=self._pipeline_wrapper,
            trigger="interval",
            minutes=15,
            id='trader_pipeline',
            next_run_time=now_ist()
        )
        self.scheduler.start()
