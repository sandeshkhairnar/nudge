import logging
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel

from config import get_settings

logger = logging.getLogger(__name__)

def get_llm(provider: Optional[str] = None, use_fast: bool = False, streaming: bool = False) -> BaseChatModel:
    """
    Factory function to return the correct LangChain LLM instance.
    """
    settings = get_settings()
    target_provider = provider or settings.ai_provider

    if target_provider == "claude":
        model = settings.claude_fast_model if use_fast else settings.claude_model
        return ChatAnthropic(
            model=model,
            anthropic_api_key=settings.anthropic_api_key,
            streaming=streaming
        )
    elif target_provider == "gemini":
        model = settings.gemini_fast_model if use_fast else settings.gemini_model
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=settings.google_api_key,
            streaming=streaming
        )
    elif target_provider == "openai":
        model = settings.openai_fast_model if use_fast else settings.openai_model
        return ChatOpenAI(
            model=model,
            api_key=settings.openai_api_key,
            streaming=streaming
        )
    elif target_provider == "groq":
        model = settings.groq_fast_model if use_fast else settings.groq_model
        return ChatOpenAI(
            model=model,
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            streaming=streaming
        )
    else:
        raise ValueError(f"Unsupported AI provider: {target_provider}")

def get_fast_llm() -> BaseChatModel:
    """Return the lightweight/cheaper tier LLM."""
    return get_llm(use_fast=True)
