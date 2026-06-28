class Strategy:
    # ── Existing (improved) ──────────────────────────────────────────

    @staticmethod
    def ma_crossover(df) -> dict:
        """Golden/Death cross: detect actual crossover events, not just which SMA is on top."""
        sma_50 = df["SMA_50"].dropna()
        sma_200 = df["SMA_200"].dropna()
        if len(sma_50) < 2 or len(sma_200) < 2:
            return {"strategy": "MA_crossover", "signal": "HOLD", "strength": 0}

        prev_50, curr_50 = sma_50.iloc[-2], sma_50.iloc[-1]
        prev_200, curr_200 = sma_200.iloc[-2], sma_200.iloc[-1]

        # Golden cross: 50 crossed ABOVE 200
        if prev_50 <= prev_200 and curr_50 > curr_200:
            return {"strategy": "MA_crossover", "signal": "LONG", "strength": "strong",
                    "cross_detected": True}
        # Death cross: 50 crossed BELOW 200
        elif prev_50 >= prev_200 and curr_50 < curr_200:
            return {"strategy": "MA_crossover", "signal": "SHORT", "strength": "strong",
                    "cross_detected": True}

        # No cross — report trend direction with spread as strength
        spread_pct = abs(curr_50 - curr_200) / curr_200 * 100
        trend = "LONG" if curr_50 > curr_200 else "SHORT"
        return {
            "strategy": "MA_crossover",
            "signal": trend,
            "strength": round(spread_pct, 2),
            "cross_detected": False,
        }

    @staticmethod
    def rsi_mean_revert(df, oversold=30, overbought=70) -> dict:
        """RSI overbought/oversold mean reversion."""
        rsi = float(df["RSI_14"].iloc[-1])
        if rsi < oversold:
            signal = "LONG"
        elif rsi > overbought:
            signal = "SHORT"
        else:
            signal = "HOLD"
        return {"strategy": "RSI_mean_revert", "signal": signal, "rsi": round(rsi, 2)}

    @staticmethod
    def macd_momentum(df) -> dict:
        """MACD line vs signal line. Adds histogram direction for strength context."""
        macd = float(df["MACD"].iloc[-1])
        sig = float(df["MACDs"].iloc[-1])
        prev_macd = float(df["MACD"].iloc[-2]) if len(df) >= 2 else macd
        prev_sig = float(df["MACDs"].iloc[-2]) if len(df) >= 2 else sig

        # Current state
        signal = "LONG" if macd > sig else "SHORT"

        # Histogram: is momentum accelerating or decelerating?
        hist = macd - sig
        prev_hist = prev_macd - prev_sig
        if abs(hist) > abs(prev_hist):
            momentum = "accelerating"
        elif abs(hist) < abs(prev_hist):
            momentum = "decelerating"
        else:
            momentum = "steady"

        return {
            "strategy": "MACD_momentum",
            "signal": signal,
            "histogram": round(hist, 6),
            "momentum": momentum,
        }

    # ── New strategies ───────────────────────────────────────────────

    @staticmethod
    def bb_squeeze_breakout(df) -> dict:
        """BB squeeze: volatility contraction signals impending expansion breakout.
        When bands narrow, market is coiling — a directional move is likely next."""
        bb_width = df["BB_UPPER"] - df["BB_LOWER"]
        if len(bb_width) < 40:
            return {"strategy": "BB_squeeze", "signal": "HOLD", "squeeze": False}

        recent = bb_width.tail(20).mean()
        prior = bb_width.iloc[-40:-20].mean()

        # No squeeze — nothing to act on
        if recent >= prior * 0.8:
            return {"strategy": "BB_squeeze", "signal": "HOLD", "squeeze": False}

        # Squeeze active — direction from close vs BB midline
        midline = (df["BB_UPPER"].iloc[-1] + df["BB_LOWER"].iloc[-1]) / 2
        close = df["close"].iloc[-1]
        direction = "LONG" if close > midline else "SHORT"
        squeeze_pct = round((1 - recent / prior) * 100, 1)
        return {
            "strategy": "BB_squeeze",
            "signal": direction,
            "squeeze": True,
            "squeeze_pct": squeeze_pct,
        }

    @staticmethod
    def volume_confirmation(df) -> dict:
        """Volume must confirm price direction. High-volume moves are higher conviction.
        Low-volume moves are suspect — likely noise or manipulation."""
        close = df["close"]
        volume = df["volume"]
        price_up = close.iloc[-1] > close.iloc[-3]
        avg_vol = volume.tail(20).mean()
        current_vol = volume.iloc[-1]
        vol_ratio = round(current_vol / avg_vol, 2) if avg_vol > 0 else 1.0

        if price_up and vol_ratio > 1.2:
            return {"strategy": "volume_confirm", "signal": "LONG",
                    "note": "price rising on strong volume", "vol_ratio": vol_ratio}
        elif not price_up and vol_ratio > 1.2:
            return {"strategy": "volume_confirm", "signal": "SHORT",
                    "note": "price falling on strong volume", "vol_ratio": vol_ratio}
        else:
            return {"strategy": "volume_confirm", "signal": "HOLD",
                    "note": "low conviction — volume below average", "vol_ratio": vol_ratio}

    @staticmethod
    def rsi_divergence(df, lookback=14) -> dict:
        """RSI divergence: when price and RSI move in opposite directions.
        Bearish divergence: price makes higher high, RSI makes lower high → SHORT.
        Bullish divergence: price makes lower low, RSI makes higher low → LONG."""
        if len(df) < lookback:
            return {"strategy": "RSI_divergence", "signal": "HOLD", "divergence": "none"}

        close = df["close"].tail(lookback)
        rsi = df["RSI_14"].tail(lookback)

        # Find peaks in the last lookback candles (top 2)
        close_peaks = close.nlargest(2)
        rsi_at_peaks = rsi.loc[close_peaks.index]

        # Find troughs
        close_troughs = close.nsmallest(2)
        rsi_at_troughs = rsi.loc[close_troughs.index]

        # Bearish divergence: price makes higher high, RSI makes lower high
        if len(close_peaks) >= 2 and len(rsi_at_peaks) >= 2:
            if close_peaks.iloc[0] > close_peaks.iloc[1] and rsi_at_peaks.iloc[0] < rsi_at_peaks.iloc[1]:
                return {"strategy": "RSI_divergence", "signal": "SHORT",
                        "divergence": "bearish", "note": "price higher high + RSI lower high"}

        # Bullish divergence: price makes lower low, RSI makes higher low
        if len(close_troughs) >= 2 and len(rsi_at_troughs) >= 2:
            if close_troughs.iloc[0] < close_troughs.iloc[1] and rsi_at_troughs.iloc[0] > rsi_at_troughs.iloc[1]:
                return {"strategy": "RSI_divergence", "signal": "LONG",
                        "divergence": "bullish", "note": "price lower low + RSI higher low"}

        return {"strategy": "RSI_divergence", "signal": "HOLD", "divergence": "none"}

    @staticmethod
    def detect_regime(df) -> dict:
        """Classify the market regime so the LLM knows WHICH strategies to trust.

        TRENDING (ADX > 25): trust trend-following (MA, MACD). Mean-reversion signals
            are traps — RSI oversold in a downtrend keeps going down.
        RANGING (ADX < 20): trust mean-reversion (RSI, BB touches). Trend signals
            are traps — MA crossovers whipsaw in chop.
        TRANSITIONAL (ADX 20-25): no strategy has a clear edge. Be cautious."""
        adx = float(df["ADX_14"].iloc[-1])
        atr = float(df["ATR_14"].iloc[-1])
        atr_avg = float(df["ATR_14"].tail(50).mean()) if len(df) >= 50 else atr

        # Regime
        if adx > 25:
            regime = "TRENDING"
            strength = "strong" if adx > 35 else "moderate"
        elif adx < 20:
            regime = "RANGING"
            bb_width = float(df["BB_UPPER"].iloc[-1] - df["BB_LOWER"].iloc[-1])
            bb_width_avg = float((df["BB_UPPER"] - df["BB_LOWER"]).tail(20).mean())
            strength = "tight" if bb_width < bb_width_avg * 0.8 else "wide"
        else:
            regime = "TRANSITIONAL"
            strength = "uncertain"

        # Volatility context for stop-loss calibration
        if atr > atr_avg * 1.3:
            vol_regime = "high"
            suggested_sl_mult = 2.0
        elif atr < atr_avg * 0.7:
            vol_regime = "low"
            suggested_sl_mult = 1.0
        else:
            vol_regime = "normal"
            suggested_sl_mult = 1.5

        # Which strategies to trust in this regime
        if regime == "TRENDING":
            preferred = ["MA_crossover", "MACD_momentum", "volume_confirm"]
            avoid = ["RSI_mean_revert", "BB_squeeze"]
        elif regime == "RANGING":
            preferred = ["RSI_mean_revert", "BB_squeeze", "RSI_divergence"]
            avoid = ["MA_crossover", "MACD_momentum"]
        else:
            preferred = ["all_weighted_equally"]
            avoid = []

        return {
            "strategy": "regime_detector",  # meta, not a directional signal
            "signal": "HOLD",               # never votes in majority_signal
            "regime": regime,
            "regime_strength": strength,
            "adx": round(adx, 1),
            "volatility": vol_regime,
            "atr": round(atr, 2),
            "suggested_sl_atr_multiple": suggested_sl_mult,
            "preferred_strategies": preferred,
            "avoid_strategies": avoid,
        }

    # ── Aggregation ──────────────────────────────────────────────────

    @staticmethod
    def all_strategies(df) -> list[dict]:
        """Returns all signal-generating strategies. regime_detector is included
        as metadata but excluded from majority voting (signal is always HOLD)."""
        return [
            Strategy.ma_crossover(df),
            Strategy.rsi_mean_revert(df),
            Strategy.macd_momentum(df),
            Strategy.bb_squeeze_breakout(df),
            Strategy.volume_confirmation(df),
            Strategy.rsi_divergence(df),
            Strategy.detect_regime(df),  # meta — always HOLD, provides context
        ]

    @staticmethod
    def majority_signal(df) -> str:
        """Counts LONG vs SHORT across all signal-generating strategies.
        Excludes detect_regime since it always returns HOLD."""
        results = Strategy.all_strategies(df)
        longs = sum(1 for r in results if r["signal"] == "LONG")
        shorts = sum(1 for r in results if r["signal"] == "SHORT")
        if longs > shorts:
            return "LONG"
        elif shorts > longs:
            return "SHORT"
        return "HOLD"
