import json
from backend.utils.stratigies import Strategy


class Prompts:
    @staticmethod
    def research_prompt(summary: dict, df) -> str:
        strategy_results = Strategy.all_strategies(df)
        majority = Strategy.majority_signal(df)

        # Exclude regime_detector from signal list — it's meta (always HOLD),
        # and the summary.regime block already carries the same information.
        signal_strategies = [r for r in strategy_results if r["strategy"] != "regime_detector"]

        atr = summary["regime"].get("atr") or "unknown"
        volatility = summary["regime"].get("volatility", "normal")
        regime_class = summary["regime"]["classification"]
        regime_implication = summary["regime"]["implication"]

        return f"""You are the Researcher Agent at StratOS, an AI quant hedge fund for crypto futures.

## Your Task
Analyze the market data below and output a trade plan the Trade Executor can directly execute on Binance Futures Testnet.

## Market Data
{json.dumps(summary, indent=2)}

The `regime` field above is critical — read it first. {regime_implication}

## Quantitative Sentiment (Binance Futures)
If the `quantitative` section is present, these are real-money on-chain signals:
- **funding_bias**: "bullish_overheating" = longs crowded, reversal risk. "bearish_short_crowded" = shorts crowded, squeeze risk. "neutral" = no signal.
- **taker_bias**: "aggressive_buyers" or "aggressive_sellers" = real-money conviction via market orders. This is the strongest directional signal.
- **oi_delta_24h_pct**: Rising OI = new capital entering (confirmed trend). Falling OI = capital leaving (weakening trend).
- **synthesis**: Pre-computed summary. Use this to confirm or overrule your technical read. If funding says overheated and taker says aggressive sellers, trust the taker divergence — it's a stronger signal than the indicator.

## Strategy Signals
{json.dumps(signal_strategies, indent=2)}
Majority direction: **{majority}**

## Strategy Guidance
Regime matters more than individual signals. If majority conflicts with the regime's implication, trust the regime. A TRENDING regime means trend-following signals (MA, MACD) are reliable and mean-reversion (RSI, BB) is noise. A RANGING regime means the opposite. In TRANSITIONAL, require stronger agreement and prefer lower confidence.

## Output
Output ONLY a JSON object inside a ```json fence. No other text.

```json
{{
  "edge_found": true,
  "symbol": "ETHUSDT",
  "direction": "short",
  "confidence": "high",
  "entry_price": 2075.40,
  "stop_loss": 2150.61,
  "take_profit": 1972.63,
  "leverage": 5,
  "hypothesis": "Synthesize at least two independent data sources (indicators, sentiment, strategies). Mention the regime and how it affects your decision.",
  "supporting_data": {{
    "risk_reward_ratio": 2.1,
    "rsi_value": 43.97,
    "bb_position": "mid",
    "sentiment_lean": "negative (11 negative vs 5 positive across 9 sources)"
  }}
}}
```

## Price Rules
- `entry_price`: current market price (use `close` from the data).
- `stop_loss`: invalidation point. SHORT: above entry. LONG: below entry. Set SL 15–20% away from the entry price. This is fixed — do NOT widen it. Tight SL = small, consistent losses instead of blown accounts.
- `take_profit`: target price. SHORT: below entry. LONG: above entry. Set TP 20–30% away from the entry price. This is a fixed range — do NOT chase wider targets. Consistent 20-30% wins compound faster than occasional home runs.
- `risk_reward_ratio`: abs(tp - entry) / abs(sl - entry). Must be >= 1.5.
- `leverage`: integer 1-10. See leverage rules below.
- **IMPORTANT**: Do NOT set TP beyond 30% or SL beyond 20% of entry. The bot's edge is consistency, not chasing moonshots. A 25% profit taken consistently beats a 78% peak that reverses.

## Confidence Rules
- "high": 2+ independent signals agree AND direction aligns with regime. Use only for clear, multi-signal setups.
- "medium": one strong signal, or signals agree but regime does not confirm.
- "low": single weak indicator, pure sentiment, or TRANSITIONAL regime.

## Leverage Rules
high → 5, medium → 3, low → 2

## Trading Fees
Binance futures market order fee is 0.05%. Account for this in your RR calculation.

## Rules
- direction MUST match the logic. RSI oversold + near BB lower = long. RSI overbought + near BB upper = short. MACD < 0 bearish, > 0 bullish.
- hypothesis MUST synthesize 2+ data sources AND mention the regime. If `quantitative` data is present, you MUST include it as one of your sources — it is real-money conviction, not an opinion.
- Output ONLY the JSON inside a ```json code block. No other text."""
