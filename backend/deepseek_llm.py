import os
from dotenv import load_dotenv
from langchain_deepseek import ChatDeepSeek
from langchain_groq import ChatGroq

load_dotenv()
_deepseek_llm = None
_groq_llm = None


def get_deepseek():
    global _deepseek_llm
    if _deepseek_llm is None:
        _deepseek_llm = ChatDeepSeek(
            model="deepseek-v4-flash",
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            temperature=0.21,
            verbose=False,
            timeout=300,
            max_retries=2,
        )
    return _deepseek_llm


def get_groq():
    global _groq_llm
    if _groq_llm is None:
        _groq_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.21,
            timeout=300,
            max_retries=2,
        )
    return _groq_llm


get_deepseek_llm = get_deepseek
