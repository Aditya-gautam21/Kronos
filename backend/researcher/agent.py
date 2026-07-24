from concurrent.futures import ThreadPoolExecutor
from backend.researcher.indicators import TechnicalIndicators
from backend.researcher.sentiment import SentimentAnalyzer
from backend.researcher.summary import summarize_for_llm
from backend.researcher.binance import BINANCE
from backend.utils.prompts import Prompts
from backend.deepseek_llm import get_deepseek_llm
from backend.state import load_state, save_state, add_log, now_ist

class ResearchAgent:
    def __init__(self):
        pass

    def research(self, symbol):
        state = load_state()
        research_item = {
            "id": f"res-{symbol}-{int(now_ist().timestamp())}",
            "time": now_ist().strftime("%H:%M:%S"),
            "desc": f"Analyzing indicators and sentiment for {symbol}."
        }
        state.setdefault("pipeline", {}).setdefault("research", []).append(research_item)
        state["pipeline"]["research"] = state["pipeline"]["research"][-5:]
        save_state(state)

        with ThreadPoolExecutor(max_workers=2) as executor:
            tech_future = executor.submit(TechnicalIndicators().ohlcv_indicators_combined, symbol)
            sentiment_future = executor.submit(SentimentAnalyzer().fetch_and_analyze, symbol, hours=24)

        technical_data = tech_future.result()
        sentiment_data = sentiment_future.result()
        quant_data = BINANCE().quantitative_data(symbol)

        summary = summarize_for_llm(df=technical_data, sentiment_results=sentiment_data, symbol=symbol, quantitative_data=quant_data)

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