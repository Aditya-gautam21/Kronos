def summarize_for_llm(df, sentiment_results, symbol):
    latest = df.iloc[-1]
    week = df.tail(168)
    month = df.tail(720)

    # sentiment counts
    sentiment_labels = [s.get("sentiment", {}).get("label", "") for s in sentiment_results]
    negative_count = sum(1 for l in sentiment_labels if l == "negative")
    positive_count = sum(1 for l in sentiment_labels if l == "positive")

    # sma crossover detection
    sma_50 = df["SMA_50"].dropna()
    sma_200 = df["SMA_200"].dropna()
    if len(sma_50) >= 2 and len(sma_200) >= 2:
        prev_50, prev_200 = sma_50.iloc[-2], sma_200.iloc[-2]
        curr_50, curr_200 = sma_50.iloc[-1], sma_200.iloc[-1]
        if prev_50 > prev_200 and curr_50 < curr_200:
            sma_cross = "SMA_50 crossed BELOW SMA_200 (bearish)"
        elif prev_50 < prev_200 and curr_50 > curr_200:
            sma_cross = "SMA_50 crossed ABOVE SMA_200 (bullish)"
        else:
            sma_cross = None
    else:
        sma_cross = None

    # rsi oversold days
    rsi_oversold_days = int((week["RSI_14"].dropna() < 30).sum())

    # bb squeeze (width narrowing over last 20 candles vs prior 20)
    bb_width = df["BB_UPPER"] - df["BB_LOWER"]
    recent_width = bb_width.tail(20).mean()
    prior_width = bb_width.iloc[-40:-20].mean() if len(bb_width) >= 40 else recent_width
    bb_squeeze = bool(recent_width < prior_width * 0.8)

    sample_headlines = [
        {"source": r["source"], "title": r["title"], "sentiment": r["sentiment"]["label"]}
        for r in sentiment_results[:5] if r.get("sentiment")
    ]

    # ── New: ADX-based regime detection ──────────────────────────────
    adx = float(latest["ADX_14"]) if "ADX_14" in df.columns else None
    atr = float(latest["ATR_14"]) if "ATR_14" in df.columns else None
    atr_avg = float(df["ATR_14"].tail(50).mean()) if "ATR_14" in df.columns and len(df) >= 50 else atr

    if adx is not None:
        if adx > 25:
            regime = "TRENDING"
            regime_detail = "strong trend" if adx > 35 else "moderate trend"
        elif adx < 20:
            regime = "RANGING"
            regime_detail = "tight range" if bb_squeeze else "wide range"
        else:
            regime = "TRANSITIONAL"
            regime_detail = "no clear regime"
    else:
        regime = "UNKNOWN"
        regime_detail = "ADX not available"
        adx = 0

    # ── New: Volatility context ──────────────────────────────────────
    if atr is not None and atr_avg is not None and atr_avg > 0:
        atr_ratio = round(atr / atr_avg, 2)
        if atr_ratio > 1.3:
            vol_regime = "high"
        elif atr_ratio < 0.7:
            vol_regime = "low"
        else:
            vol_regime = "normal"
    else:
        vol_regime = "unknown"
        atr_ratio = 1.0

    # ── New: Price vs SMA spread (trend strength %) ──────────────────
    if len(sma_50) >= 1 and len(sma_200) >= 1:
        sma_spread_pct = round(abs(float(sma_50.iloc[-1]) - float(sma_200.iloc[-1])) / float(sma_200.iloc[-1]) * 100, 2)
    else:
        sma_spread_pct = 0

    return {
        "asset": symbol,
        "timeframe": "1h",
        "current": {
            "price": float(latest["close"]),
            "rsi_14": float(latest["RSI_14"]),
            "macd_vs_signal": "bullish" if latest["MACD"] > 0 else "bearish",
            "vs_sma_50": "above" if latest["close"] > latest["SMA_50"] else "below",
            "vs_sma_200": "above" if latest["close"] > latest["SMA_200"] else "below",
            "bb_position": (
                "near_lower" if latest["close"] < latest["BB_LOWER"] * 1.01
                else "near_upper" if latest["close"] > latest["BB_UPPER"] * 0.99
                else "mid"
            ),
        },
        "last_24h": {
            "price_change_pct": round((week["close"].iloc[-1] / week["close"].iloc[0] - 1) * 100, 2),
            "high": float(week["high"].max()),
            "low": float(week["low"].min()),
            "volume_trend": "rising" if week["volume"].iloc[-1] > week["volume"].mean() else "falling",
            "rsi_min": float(week["RSI_14"].min()),
            "rsi_max": float(week["RSI_14"].max()),
        },
        "last_7d": {
            "price_change_pct": round((month["close"].iloc[-1] / month["close"].iloc[0] - 1) * 100, 2),
            "high": float(month["high"].max()),
            "low": float(month["low"].min()),
            "rsi_min": float(month["RSI_14"].min()),
            "rsi_max": float(month["RSI_14"].max()),
        },
        "signals": {
            "sma_cross": sma_cross,
            "rsi_oversold_days": rsi_oversold_days,
            "bb_squeeze": bb_squeeze,
            "sma_spread_pct": sma_spread_pct,
        },
        # ── New section ──────────────────────────────────────────────
        "regime": {
            "classification": regime,
            "detail": regime_detail,
            "adx": round(adx, 1),
            "volatility": vol_regime,
            "atr": round(atr, 2) if atr else None,
            "atr_vs_50_period_avg": atr_ratio,
            "implication": (
                "Trend-following strategies (MA crossover, MACD) are reliable. "
                "Mean-reversion signals (RSI) are traps — trends persist."
                if regime == "TRENDING"
                else "Mean-reversion strategies (RSI, BB touch) are reliable. "
                "Trend-following signals whipsaw — stay skeptical of breakouts."
                if regime == "RANGING"
                else "No strategy class has a clear edge. Size small or skip."
                if regime == "TRANSITIONAL"
                else "Regime unknown — rely on strategy majority and be cautious."
            ),
        },
        "sentiment": {
            "recent_leaning": (
                "negative" if negative_count > positive_count
                else "positive" if positive_count > negative_count
                else "neutral"
            ),
            "positive_count": positive_count,
            "negative_count": negative_count,
            "headline_count_24h": len(sentiment_results),
            "total_sources": len(set(r["source"] for r in sentiment_results if r.get("source"))),
            "sample_headlines": sample_headlines,
        },
    }
