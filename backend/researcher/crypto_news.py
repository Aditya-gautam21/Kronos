import feedparser
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

ASSET_KEYWORDS = {
    "ETHUSDT": ["ethereum", "eth", "ether", "vitalik", "merge", "layer 2", "l2", "arbitrum", "optimism"],
    "BTCUSDT": ["bitcoin", "btc", "bitcoin etf", "halving", "satoshi"],
    "SOLUSDT": ["solana", "sol", "phantom"],
}


class NewsCollector:
    def __init__(self, data_dir="./raw_data"):
        self.rss_feeds = {
            # crypto news sites
            "CoinDesk": "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
            "Cointelegraph": "https://cointelegraph.com/rss",
            "CryptoSlate": "https://cryptoslate.com/feed/",
            "Decrypt": "https://decrypt.co/feed",
            "NewsBTC": "https://www.newsbtc.com/feed/",
            "Bitcoin.com": "https://news.bitcoin.com/feed/",
            "Blockonomi": "https://blockonomi.com/feed/",
            "Coinspeaker": "https://www.coinspeaker.com/feed/",
            "r/CryptoCurrency": "https://www.reddit.com/r/CryptoCurrency/.rss",
            "r/ethereum": "https://www.reddit.com/r/ethereum/.rss",
            "r/Bitcoin": "https://www.reddit.com/r/Bitcoin/.rss",
            "r/CryptoMarkets": "https://www.reddit.com/r/CryptoMarkets/.rss",
        }
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def fetch_news(self, hours=12, asset="ETHUSDT"):
        keywords = ASSET_KEYWORDS.get(asset, [])
        cutoff_time = datetime.now() - timedelta(hours=hours)
        all_news = []

        for source, url in self.rss_feeds.items():
            try:
                feed = feedparser.parse(url)

                for entry in feed.entries:
                    try:
                        published = datetime(*entry.published_parsed[:6])

                        if published <= cutoff_time:
                            continue

                        title = entry.title
                        summary = entry.get("summary", "")
                        text = (title + " " + summary).lower()

                        if not any(kw in text for kw in keywords):
                            continue

                        all_news.append({
                            "source": source,
                            "title": title,
                            "published": published.isoformat(),
                            "summary": summary[:200],
                        })

                    except Exception as e:
                        print(f"Published parsed problem: {e}")

            except Exception as e:
                print(f"Error fetching from {source}: {e}")

        return all_news
