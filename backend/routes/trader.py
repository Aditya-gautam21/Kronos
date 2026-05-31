import asyncio
import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import APIRouter
from binance.client import Client
from binance.exceptions import BinanceAPIException

from backend.trade_execution_agent import TradeExecutionAgent, LEVERAGE
from backend.state import load_state, save_state, add_log

load_dotenv()
router = APIRouter()


def _get_binance_client():
    return Client(
        api_key=os.getenv("BINANCE_TESTNET_API"),
        api_secret=os.getenv("BINANCE_TESTNET_SECRET"),
        testnet=True,
    )


@router.get("/bot-status")
async def bot_status():
    state = load_state()
    return {
        "is_running": state["is_running"],
        "last_execution": state["last_execution"],
        "last_result": state["last_result"],
        "total_executions": state["bot_runs"],
    }


@router.get("/positions")
async def positions():
    try:
        client = _get_binance_client()
        raw = client.futures_position_information()
        active = [p for p in raw if float(p.get("positionAmt", 0)) != 0]

        result = []
        for p in active:
            symbol = p.get("symbol", "UNKNOWN")
            amt = float(p.get("positionAmt", 0))
            entry_price = float(p.get("entryPrice", 0))
            mark_price = float(p.get("markPrice", 0))
            unrealized_pnl = float(p.get("unRealizedProfit", 0))

            side = "LONG" if amt > 0 else "SHORT"
            size = abs(amt)

            if entry_price > 0:
                pnl_pct = ((mark_price - entry_price) / entry_price * 100)
                if side == "SHORT":
                    pnl_pct = -pnl_pct
                pnl_pct_str = f"{pnl_pct:+.2f}%"
            else:
                pnl_pct_str = "0.00%"

            result.append({
                "symbol": symbol,
                "side": side,
                "size": size,
                "entry_price": entry_price,
                "mark_price": mark_price,
                "pnl": round(unrealized_pnl, 2),
                "pnl_pct": pnl_pct_str,
                "leverage": int(float(p.get("leverage", 1))),
                "liquidation_price": float(p.get("liquidationPrice", 0)),
            })

        return result
    except Exception:
        return []


@router.get("/trade-history")
async def trade_history():
    state = load_state()
    return state["trade_history"]


@router.get("/metrics")
async def metrics():
    state = load_state()
    trades = state["trade_history"]

    total_pnl = sum(t.get("pnl", 0) or 0 for t in trades)
    winners = [t for t in trades if (t.get("pnl") or 0) > 0]
    losers = [t for t in trades if (t.get("pnl") or 0) < 0]
    win_rate = (len(winners) / len(trades) * 100) if trades else 0

    active_count = 0
    try:
        client = _get_binance_client()
        raw = client.futures_position_information()
        active_count = len([p for p in raw if float(p.get("positionAmt", 0)) != 0])
    except Exception:
        pass

    return {
        "total_pnl": round(total_pnl, 2),
        "active_strategies": active_count,
        "max_strategies": 12,
        "strategies_in_risk_review": 0,
        "drawdown": 0.0,
        "max_drawdown_limit": -5.0,
        "win_rate": round(win_rate, 1),
        "win_rate_period": "30D",
    }


@router.get("/pipeline")
async def pipeline():
    state = load_state()
    return state.get("pipeline", {"research": [], "backtest": [], "risk_review": []})


@router.get("/allocation")
async def allocation():
    try:
        client = _get_binance_client()
        account = client.futures_account()
        total_balance = float(account.get("totalWalletBalance", 0))
        raw_positions = client.futures_position_information()

        total_position_value = sum(
            abs(float(p.get("positionAmt", 0))) * float(p.get("markPrice", 0))
            for p in raw_positions
        )

        cash_pct = max(0, (total_balance - total_position_value) / total_balance * 100) if total_balance > 0 else 100
        exposed_pct = (total_position_value / total_balance * 100) if total_balance > 0 else 0

        allocations = []
        for p in raw_positions:
            amt = float(p.get("positionAmt", 0))
            if amt == 0:
                continue
            value = abs(amt * float(p.get("markPrice", 0)))
            pct = round(value / total_balance * 100, 1) if total_balance > 0 else 0
            allocations.append({
                "name": p.get("symbol", "UNKNOWN"),
                "value": pct,
                "color": "#00f0ff" if amt > 0 else "#ff00ff",
            })

        if cash_pct > 0.5:
            allocations.append({"name": "Cash (Reserve)", "value": round(cash_pct, 1), "color": "#333333"})

        return {
            "exposure_pct": round(exposed_pct, 1),
            "total_balance": round(total_balance, 2),
            "allocations": allocations,
        }
    except Exception:
        return {
            "exposure_pct": 0,
            "total_balance": 0,
            "allocations": [{"name": "Cash (Reserve)", "value": 100, "color": "#333333"}],
        }


@router.get("/logs")
async def logs():
    state = load_state()
    return state["logs"]


@router.post("/start-autonomous-bot")
async def start_bot():
    state = load_state()
    if state["is_running"]:
        return {"status": "error", "reason": "Bot is already running"}

    state["is_running"] = True
    save_state(state)

    add_log("SYSTEM", "Autonomous bot started. Research agent analyzing markets...", "info")
    add_log("RESEARCH", "Fetching ETHUSDT 1h klines (200 candles) + news sentiment...", "info")

    try:
        agent = TradeExecutionAgent()
        result = await asyncio.to_thread(agent.execute)

        state = load_state()
        state["is_running"] = False
        state["bot_runs"] += 1
        state["last_execution"] = datetime.now(timezone.utc).isoformat()
        state["last_result"] = {k: v for k, v in result.items() if k != "orders"}

        if result.get("status") == "executed":
            trade = result.get("trade", {})
            sizing = result.get("sizing", {})

            trade_entry = {
                "id": str(uuid.uuid4())[:8],
                "symbol": trade.get("symbol", "UNKNOWN"),
                "side": trade.get("direction", "unknown").upper(),
                "size": sizing.get("quantity", 0),
                "entry_price": trade.get("entry_price", 0),
                "stop_loss": trade.get("stop_loss", 0),
                "take_profit": trade.get("take_profit", 0),
                "status": "active",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "pnl": None,
                "confidence": trade.get("confidence", "unknown"),
                "hypothesis": trade.get("hypothesis", ""),
            }
            state["trade_history"].append(trade_entry)

            add_log("EXECUTION", f"Trade placed: {trade.get('symbol')} {trade.get('direction', '').upper()} x{LEVERAGE} | Entry: ${trade.get('entry_price')} | Qty: {sizing.get('quantity')} | Risk: {sizing.get('risk_pct')}%", "success")
            add_log("EXECUTION", f"Stop-loss: ${trade.get('stop_loss')} | Take-profit: ${trade.get('take_profit')}", "info")
            add_log("SYSTEM", f"Done. Check testnet.binancefuture.com for {trade.get('symbol')} position.", "success")

        elif result.get("status") == "skipped":
            add_log("QUANT", f"No trade taken: {result.get('reason', 'No edge found')}", "warning")

        else:
            add_log("SYSTEM", f"Bot finished with status: {result.get('status', 'unknown')}", "warning")

        state["pipeline"] = {
            "research": [
                {"id": "LATEST", "time": "just now", "desc": (result.get("trade", {}).get("hypothesis", "Analyzing markets...") or "Scanning for setups")[:100]}
            ] if result.get("trade") else [],
            "backtest": [
                {"id": "LATEST", "time": "just now", "desc": f"Confidence: {result.get('trade', {}).get('confidence', 'N/A')} | Direction: {result.get('trade', {}).get('direction', 'N/A')}"}
            ] if result.get("trade") else [],
            "risk_review": [
                {"id": "LATEST", "time": "just now", "desc": f"Kelly sizing: {result.get('sizing', {}).get('risk_pct', 'N/A')}% risk | Qty: {result.get('sizing', {}).get('quantity', 'N/A')}"}
            ] if result.get("sizing") else [],
        }

        save_state(state)
        return {"status": result.get("status", "error"), "result": result}

    except Exception as e:
        state = load_state()
        state["is_running"] = False
        save_state(state)
        add_log("SYSTEM", f"Execution failed: {str(e)}", "error")
        return {"status": "error", "reason": str(e)}
