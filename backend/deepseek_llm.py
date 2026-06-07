import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_deepseek import ChatDeepSeek
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

load_dotenv()

_deepseek_llm = None

def get_deepseek_llm():
    global _deepseek_llm
    if _deepseek_llm is None:
        llm = ChatDeepSeek(
            model="deepseek-chat",
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            temperature=0.21,
            verbose=False,
            timeout=300,
            max_retries=2
        )
    return llm