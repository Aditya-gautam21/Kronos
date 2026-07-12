from transformers import pipeline
from transformers.utils import logging
from backend.researcher.crypto_news import NewsCollector

class SentimentAnalyzer:
    _pipeline = None  

    def __init__(self):
        logging.set_verbosity_error()
        if SentimentAnalyzer._pipeline is None:
            SentimentAnalyzer._pipeline = pipeline(
                "sentiment-analysis",
                model="mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis",
                device=-1,
            )
        self.pipeline = SentimentAnalyzer._pipeline

    def analyze(self, text: str) -> dict | None:
        if not text:
            return None
        result = self.pipeline(text)[0]
        return {"label": result["label"], "score": round(result["score"], 4)}

    def fetch_and_analyze(self, asset: str = "ETHUSDT", hours: int = 12) -> list[dict]:
        collector = NewsCollector()
        news_items = collector.fetch_news(symbol=asset, hours=hours)

        results = []
        for item in news_items:
            title = item.get("title", "")
            if not title:
                continue
            sentiment = self.analyze(title)
            results.append({
                "source": item.get("source"),
                "title": title,
                "published": item.get("published"),
                "sentiment": sentiment,
            })

        return results