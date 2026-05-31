import json
from datetime import datetime, timezone
from pathlib import Path

STATE_FILE = Path(__file__).resolve().parent / "state.json"


def _default_state():
    return {
        "trade_history": [],
        "logs": [
            {
                "id": 1,
                "agent": "SYSTEM",
                "message": "System standing by. Waiting for CIO to initiate autonomous trading.",
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3],
                "type": "info",
            }
        ],
        "bot_runs": 0,
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


def add_log(agent, message, log_type="info"):
    state = load_state()
    log_id = max((e["id"] for e in state["logs"]), default=0) + 1
    state["logs"].append(
        {
            "id": log_id,
            "agent": agent,
            "message": message,
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3],
            "type": log_type,
        }
    )
    if len(state["logs"]) > 200:
        state["logs"] = state["logs"][-200:]
    save_state(state)
