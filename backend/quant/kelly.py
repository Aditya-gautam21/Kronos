def kelly_position_size(
    confidence: str,
    direction: str,
    entry_price: float,
    stop_loss: float,
    take_profit: float,
    balance: float,
    leverage: int = 5,
    max_risk_pct: float = 0.10,
    min_notional: float = 50.0,
) -> dict:
    confidence_to_prob = {"high": 0.60, "medium": 0.50, "low": 0.40}
    win_prob = confidence_to_prob.get(confidence, 0.45)

    if direction == "short":
        risk_pct_per_unit = abs(stop_loss - entry_price) / entry_price
        reward_pct_per_unit = abs(entry_price - take_profit) / entry_price
    else:
        risk_pct_per_unit = abs(entry_price - stop_loss) / entry_price
        reward_pct_per_unit = abs(take_profit - entry_price) / entry_price

    if risk_pct_per_unit == 0:
        return {"quantity": 0, "risk_pct": 0, "kelly_fraction": 0, "leverage": leverage, "error": "zero risk distance"}

    b_ratio = reward_pct_per_unit / risk_pct_per_unit
    kelly_fraction = win_prob - (1 - win_prob) / b_ratio
    kelly_fraction = kelly_fraction / 2
    kelly_fraction = max(0.01, min(max_risk_pct, kelly_fraction))

    position_value = balance * kelly_fraction * leverage

    if position_value < min_notional:
        position_value = min_notional
        if position_value > balance * leverage:
            position_value = balance * leverage * 0.95

    quantity = position_value / entry_price
    quantity = max(quantity, 0.001)
    quantity = round(quantity, 3)

    return {
        "quantity": quantity,
        "leverage": leverage,
        "notional_usdt": round(position_value, 2),
        "margin_usdt": round(position_value / leverage, 2),
        "risk_pct": round(kelly_fraction * 100, 2),
        "kelly_fraction": round(kelly_fraction, 4),
        "sl_distance_pct": round(risk_pct_per_unit * 100, 2),
        "tp_distance_pct": round(reward_pct_per_unit * 100, 2),
    }