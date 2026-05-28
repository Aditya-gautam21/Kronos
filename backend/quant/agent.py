from backend.utils.extract_json import extract_json
from backend.researcher.research_agent import ResearchAgent
from backend.local_llm import get_llm


class QuantAgent:
    def __init__(self):
        get_llm()

    def generate_trade(self) -> dict:
        """Run research pipeline and return trade-ready JSON."""
        researcher = ResearchAgent()
        research_output = researcher.research()
        trade_json = extract_json(research_output)
        return trade_json
