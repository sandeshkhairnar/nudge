"""
config.py — Nudge Engine v4.0
Single source of truth for all environment variables via pydantic-settings.
All secrets are read at startup; never logged or exposed.
"""

from functools import lru_cache
from typing import Literal, Optional, Union, Dict
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── AI Provider ──────────────────────────────────────────────────────────
    ai_provider: Literal["gemini", "claude", "openai"] = Field(
        ...,
        description="Active LLM provider. Controls get_llm() factory.",
    )

    # Claude (Anthropic)
    anthropic_api_key: Optional[str] = Field(default=None, description="Required when ai_provider=claude")
    claude_model: str = Field(default="claude-sonnet-4-5", description="Smart/default Claude model")
    claude_fast_model: str = Field(default="claude-haiku-4-5", description="Fast/cheap Claude model")

    # Gemini (Google)
    google_api_key: Optional[str] = Field(default=None, description="Required when ai_provider=gemini")
    gemini_model: str = Field(default="gemini-1.5-pro-latest", description="Smart/default Gemini model")
    gemini_fast_model: str = Field(default="gemini-1.5-flash-latest", description="Fast/cheap Gemini model")

    # OpenAI
    openai_api_key: Optional[str] = Field(default=None, description="Required when ai_provider=openai")
    openai_model: str = Field(default="gpt-4o", description="Smart/default OpenAI model")
    openai_fast_model: str = Field(default="gpt-4o-mini", description="Fast/cheap OpenAI model")

    # ── Infrastructure ───────────────────────────────────────────────────────
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_service_role_key: str = Field(
        ..., description="Supabase service-role key — never expose to frontend"
    )
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis connection string, e.g. redis://localhost:6379/0")


    # ── Auth ─────────────────────────────────────────────────────────────────
    engine_secret: str = Field(
        ..., description="Shared secret for NestJS → Engine X-Engine-Secret header"
    )

    # ── Optional Integrations ────────────────────────────────────────────────
    slack_webhook_url: Optional[str] = Field(default=None, description="Slack incoming webhook URL")
    sendgrid_api_key: Optional[str] = Field(default=None, description="SendGrid key for digest emails")
    github_webhook_secret: Optional[str] = Field(
        default=None, description="HMAC-SHA256 secret for GitHub webhook verification"
    )

    # ── LangSmith Observability ──────────────────────────────────────────────
    langchain_tracing_v2: bool = Field(default=False, description="Enable LangSmith tracing")
    langchain_api_key: Optional[str] = Field(default=None, description="LangSmith API key")

    # ── LiveKit ─────────────────────────────────────────────────────────────
    livekit_url: Optional[str] = Field(default=None, description="LiveKit Host URL")
    livekit_api_key: Optional[str] = Field(default=None, description="LiveKit API Key")
    livekit_api_secret: Optional[str] = Field(default=None, description="LiveKit API Secret")

    # ── Agent Tuning ─────────────────────────────────────────────────────────
    agent_max_iterations: int = Field(
        default=5, description="Hard cap on AgentExecutor tool calls per event"
    )
    rate_limit_calls_per_hour: int = Field(
        default=60, description="AI calls allowed per workspace per hour (Redis sliding window)"
    )
    memory_window_k: int = Field(
        default=10, description="ConversationBufferWindowMemory turn window"
    )
    memory_ttl_seconds: int = Field(
        default=86_400, description="Redis TTL for workspace conversation memory (24 h)"
    )
    stall_threshold_days: int = Field(
        default=3, description="Days without update before a task is considered stalled"
    )

    # ── Derived helpers ───────────────────────────────────────────────────────

    @property
    def active_model(self) -> str:
        """Return the smart model name for the active provider."""
        return {
            "claude": self.claude_model,
            "gemini": self.gemini_model,
            "openai": self.openai_model,
        }[self.ai_provider]

    @property
    def active_fast_model(self) -> str:
        """Return the fast model name for the active provider."""
        return {
            "claude": self.claude_fast_model,
            "gemini": self.gemini_fast_model,
            "openai": self.openai_fast_model,
        }[self.ai_provider]

    # ── Validation ────────────────────────────────────────────────────────────

    @model_validator(mode="after")
    def _check_provider_key(self) -> "Settings":
        """Ensure the API key for the active provider is present."""
        required: Dict[str, Optional[str]] = {
            "claude": self.anthropic_api_key,
            "gemini": self.google_api_key,
            "openai": self.openai_api_key,
        }
        if not required[self.ai_provider]:
            key_name = {
                "claude": "ANTHROPIC_API_KEY",
                "gemini": "GOOGLE_API_KEY",
                "openai": "OPENAI_API_KEY",
            }[self.ai_provider]
            raise ValueError(
                f"AI_PROVIDER is '{self.ai_provider}' but {key_name} is not set."
            )
        return self


    @field_validator("redis_url")
    @classmethod
    def _validate_redis_url(cls, v: str) -> str:
        if not v.startswith(("redis://", "rediss://")):
            raise ValueError("REDIS_URL must start with redis:// or rediss://")
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return the singleton Settings instance.
    Cached after first call — use invalidate_settings_cache() in tests.
    """
    return Settings()  # type: ignore[call-arg]


def invalidate_settings_cache() -> None:
    """Clear the lru_cache so tests can inject a fresh .env."""
    get_settings.cache_clear()