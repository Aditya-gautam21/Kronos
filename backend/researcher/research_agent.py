import json
from backend.local_llm import get_llm
from backend.researcher.indicators import TechnicalIndicators
from backend.researcher.sentiment import SentimentAnalyzer
from backend.researcher.summary import summarize_for_llm
from backend.utils.prompts import Prompts

class ResearchAgent:
    def __init__(self):
        get_llm()

    def research(self):
        techiacl_data = TechnicalIndicators().ohlcv_indicators_combined()
        sentiment_data = SentimentAnalyzer().fetch_and_analyze(hours=24)

        summary = summarize_for_llm(df=techiacl_data, sentiment_results=sentiment_data)

        prompt = Prompts.research_prompt(summary)

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
            temperature=0.2
        )

        print(response['choices'][0]['message']['content'])
        
if __name__ == "__main__":
    ResearchAgent().research()