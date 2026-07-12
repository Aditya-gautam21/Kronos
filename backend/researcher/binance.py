import os
import pandas as pd
from dotenv import load_dotenv
from binance.client import Client

load_dotenv()

class BINANCE:
    def __init__(self):
        self.public_client = Client()

        self.testnet_client = Client(
            api_key=os.getenv("BINANCE_TESTNET_API"),
            api_secret=os.getenv("BINANCE_TESTNET_SECRET"),
            testnet=True,
        )

    def load_data(self, symbol):
        all_data = []

        klines = self.public_client.futures_klines(symbol=symbol, interval='1h', limit=1000)
        for k in klines:
            all_data.append(k)

        data = pd.DataFrame(all_data, columns=["timestamp", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "trades",
        "taker_buy_base", "taker_buy_quote","ignore"])
        
        
        data["timestamp"] = pd.to_datetime(data["timestamp"], unit="ms")
        data.set_index("timestamp", inplace=True)
        data = data[["open", "high", "low", "close", "volume"]].astype(float)

        return data
    
    def get_top_gainers(self, top_n: int = 10):
        tickers = self.public_client.futures_ticker()  
        
        usdt_pairs = [
            t for t in tickers
            if t["symbol"].endswith("USDT")
        ]
        
        sorted_gainers = sorted(
            usdt_pairs,
            key=lambda x: float(x["priceChangePercent"]),
            reverse=True
        )
        
        return [
            {
                "symbol": t["symbol"],
                "price_change_pct": float(t["priceChangePercent"]),
                "last_price": float(t["lastPrice"]),
                "volume": float(t["quoteVolume"])
            }
            for t in sorted_gainers[:top_n]
        ]
    
    def quantitative_data(self, symbol: str) -> dict:
        funding = self.public_client.futures_funding_rate(symbol=symbol, limit=24)
        taker = self.public_client.futures_taker_longshort_ratio(symbol=symbol, period='1h', limit=24)
        oi_hist = self.public_client.futures_open_interest_hist(symbol=symbol, period='1h', limit=24)
        oi_current = self.public_client.futures_open_interest(symbol=symbol)

        # --- funding rate ---
        rates = [float(f["fundingRate"]) for f in funding]
        current_rate = rates[-1] if rates else 0
        avg_rate = sum(rates) / len(rates) if rates else 0
        if current_rate > avg_rate * 1.5:
            funding_bias = "bullish_overheating"
        elif current_rate < 0:
            funding_bias = "bearish_short_crowded"
        else:
            funding_bias = "neutral"

        # --- taker buy/sell ---
        taker_ratios = [float(t["buySellRatio"]) for t in taker]
        taker_ratio_avg = sum(taker_ratios) / len(taker_ratios) if taker_ratios else 1
        buy_vol = sum(float(t["buyVol"]) for t in taker)
        sell_vol = sum(float(t["sellVol"]) for t in taker)
        if taker_ratio_avg > 1.15:
            taker_bias = "aggressive_buyers"
        elif taker_ratio_avg < 0.85:
            taker_bias = "aggressive_sellers"
        else:
            taker_bias = "balanced"

        # --- open interest trend ---
        if oi_hist and oi_current:
            oi_now = float(oi_current["openInterest"])
            oi_24h_ago = float(oi_hist[0]["sumOpenInterest"])
            oi_delta_pct = round((oi_now - oi_24h_ago) / oi_24h_ago * 100, 2) if oi_24h_ago else 0
        else:
            oi_now = 0
            oi_delta_pct = 0

        return {
            "symbol": symbol,
            "funding": {
                "current_rate": round(current_rate * 100, 4),     # %
                "avg_rate_24h": round(avg_rate * 100, 4),          # %
                "bias": funding_bias,
            },
            "taker": {
                "buy_sell_ratio": round(taker_ratio_avg, 4),
                "buy_volume": round(buy_vol, 2),
                "sell_volume": round(sell_vol, 2),
                "bias": taker_bias,
            },
            "open_interest": {
                "current": round(oi_now, 2),
                "delta_24h_pct": oi_delta_pct,
            },
        }
