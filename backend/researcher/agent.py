from concurrent.futures import ThreadPoolExecutor
from backend.local_llm import get_llm
from backend.researcher.indicators import TechnicalIndicators
from backend.researcher.sentiment import SentimentAnalyzer
from backend.researcher.summary import summarize_for_llm
from backend.utils.prompts import Prompts
from backend.deepseek_llm import get_deepseek_llm
from backend.state import add_log

class ResearchAgent:
    def __init__(self):
        get_deepseek_llm()

    def research(self):
        with ThreadPoolExecutor(max_workers=2) as executor:
            tech_future = executor.submit(TechnicalIndicators().ohlcv_indicators_combined)
            sentiment_future = executor.submit(SentimentAnalyzer().fetch_and_analyze, hours=24)

        technical_data = tech_future.result()
        sentiment_data = sentiment_future.result()

        summary = summarize_for_llm(df=technical_data, sentiment_results=sentiment_data)

        prompt = Prompts.research_prompt(summary, technical_data)

        response = get_deepseek_llm().invoke([
                {
                    'role': 'system',
                    'content': prompt
                },
                {
                    'role': 'user',
                    'content': 'Analyze the market data above and output your trade plan.',
                }
            ],
            temperature=0.21
        )

        add_log(agent="Quant", message=response.content, log_type="research_output")
        return response.content