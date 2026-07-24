
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist():
    return datetime.now(IST)

STATE_FILE = Path(__file__).resolve().parent / "state.json"


def _default_state():
    return {
        "trade_history": [],
        "logs": [
            {
                "id": 1,
                "agent": "SYSTEM",
                "message": "System standing by. Waiting for CIO to initiate autonomous trading.",
                "timestamp": now_ist().strftime("%H:%M:%S.%f")[:-3],
                "type": "info",
            }
        ],
        "bot_runs": 0,
        "open trades": 0,
        "last_execution": None,
        "last_result": None,
        "is_running": False,
        "pipeline": {
            "research": [],
            "backtest": [],
            "risk_review": [],
        },
    }


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return _default_state()


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)


def add_log(agent, message, log_type="info", open_trades: int = 0):
    state = load_state()
    log_id = max((e["id"] for e in state["logs"]), default=0) + 1
    state["logs"].append(
        {
            "id": log_id,
            "agent": agent,
            "message": str(message),
            "timestamp": now_ist().strftime("%H:%M:%S.%f")[:-3],
            "type": log_type,
        }
    )
    if open_trades:
        state["open trades"] = open_trades
    if len(state["logs"]) > 200:
        state["logs"] = state["logs"][-200:]
    save_state(state)
