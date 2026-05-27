import os
import json
from contextlib import redirect_stderr
from backend.local_llm import get_llm
from backend.researcher.indicators import TechnicalIndicators
from backend.researcher.sentiment import SentimentAnalyzer
from backend.researcher.summary import summarize_for_llm
from backend.utils.prompts import Prompts

class ResearchAgent:
    def __init__(self):
        get_llm()

    def research(self):
        technical_data = TechnicalIndicators().ohlcv_indicators_combined()
        sentiment_data = SentimentAnalyzer().fetch_and_analyze(hours=24)

        summary = summarize_for_llm(df=technical_data, sentiment_results=sentiment_data)

        prompt = Prompts.research_prompt(summary, technical_data)

        with open(os.devnull, "w") as devnull, redirect_stderr(devnull):
            response = get_llm().create_chat_completion(
                messages=[
                    {
                        'role':'system',
                        'content': prompt
                    },
                    {
                        'role': 'user',
                        'content': json.dumps(summary),
                    }
                ],
                temperature=0.25
            )

        return (response['choices'][0]['message']['content'])