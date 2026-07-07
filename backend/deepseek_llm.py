import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_deepseek import ChatDeepSeek
from langchain_groq import ChatGroq

load_dotenv()
_llm = None

def get_deepseek():
    global _llm
    if _llm is None:
        llm = ChatDeepSeek(
            model="deepseek-v4-flash",
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            temperature=0.21,
            verbose=False,
            timeout=300,
            max_retries=2
        )
    return llm

def get_groq():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            openai_api_key=os.getenv("GROQ_API_KEY"),
            openai_api_base="https://api.groq.com/openai/v1",
            temperature=0.21,
            timeout=300,
            max_retries=2
        )
    return _llm