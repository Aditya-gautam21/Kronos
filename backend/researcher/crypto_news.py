import json
from pathlib import Path
import urllib.request
import feedparser
from datetime import datetime, timedelta

KEYWORDS_FILE = Path(__file__).resolve().parent / "asset_keywords.json"

_SEED = {
    "ETHUSDT": ["ethereum", "eth", "ether", "vitalik", "merge", "layer 2", "l2", "arbitrum", "optimism"],
    "BTCUSDT": ["bitcoin", "btc", "bitcoin etf", "halving", "satoshi"],
    "SOLUSDT": ["solana", "sol", "phantom"],
}

def _load_cache() -> dict:
    if KEYWORDS_FILE.exists():
        try:
            return json.loads(KEYWORDS_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return dict(_SEED)


def _save_cache(cache: dict) -> None:
    KEYWORDS_FILE.write_text(json.dumps(cache, indent=2, sort_keys=True))


def _fetch_keywords_from_llm(symbol: str) -> list[str]:
    prompt = (
        f"The cryptocurrency futures symbol is {symbol}. "
        "What project/token does this likely refer to? "
        "Give me 5-8 lowercase keywords or short phrases that would appear "
        "in crypto news headlines about this token. Include: the project name, "
        "ticker without USDT, ecosystem terms, founder names, and related protocols.\n\n"
        "Return ONLY a JSON array of strings. No other text. Example: "
        '["bitcoin", "btc", "bitcoin etf", "halving", "satoshi", "lightning"]'
    )

    for provider in [_try_groq, _try_deepseek]:
        keywords = provider(symbol, prompt)
        if keywords:
            return keywords

    base = symbol.replace("USDT", "").lower()
    return [base, symbol.lower()]


def _try_groq(symbol: str, prompt: str) -> list[str] | None:
    try:
        from backend.deepseek_llm import get_groq
        llm = get_groq()
        return _parse_keywords_response(llm.invoke(
            [{"role": "system", "content": prompt}, {"role": "user", "content": f"Keywords for {symbol}"}],
            temperature=0.1, max_tokens=200,
        ).content)
    except Exception:
        return None


def _try_deepseek(symbol: str, prompt: str) -> list[str] | None:
    try:
        from backend.deepseek_llm import get_deepseek_llm
        llm = get_deepseek_llm()
        return _parse_keywords_response(llm.invoke(
            [{"role": "system", "content": prompt}, {"role": "user", "content": f"Keywords for {symbol}"}],
            temperature=0.1, max_tokens=200,
        ).content)
    except Exception:
        return None


def _parse_keywords_response(content: str) -> list[str] | None:
    content = content.strip()
    if "```" in content:
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    keywords = json.loads(content)
    if isinstance(keywords, list) and len(keywords) > 0:
        return keywords
    return None


def get_keywords(symbol: str) -> list[str]:
    cache = _load_cache()
    if symbol in cache:
        return cache[symbol]

    keywords = _fetch_keywords_from_llm(symbol)
    cache[symbol] = keywords
    _save_cache(cache)
    return keywords


class NewsCollector:
    def __init__(self, data_dir="./raw_data"):
        self.rss_feeds = {
            "CoinDesk": "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
            "Cointelegraph": "https://cointelegraph.com/rss",
            "CryptoSlate": "https://cryptoslate.com/feed/",
            "Decrypt": "https://decrypt.co/feed",
            "NewsBTC": "https://www.newsbtc.com/feed/",
            "Bitcoin.com": "https://news.bitcoin.com/feed/",
            "Blockonomi": "https://blockonomi.com/feed/",
            "Coinspeaker": "https://www.coinspeaker.com/feed/",
        }
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def fetch_news(self, symbol: str, hours: int = 12) -> list[dict]:
        keywords = get_keywords(symbol)
        cutoff_time = datetime.now() - timedelta(hours=hours)
        all_news = []

        for source, url in self.rss_feeds.items():
            try:
                feed = feedparser.parse(url)

                for entry in feed.entries:
                    try:
                        if not hasattr(entry, "published_parsed") or entry.published_parsed is None:
                            continue
                        published = datetime(*entry.published_parsed[:6])
                        if published <= cutoff_time:
                            continue

                        title = entry.get("title", "")
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
                    except Exception:
                        pass
            except Exception as e:
                print(f"Error fetching from {source}: {e}")

        return all_news
