"""
routers/health_router.py — Nudge Engine v4.0
GET /health/json → machine-readable health payload consumed by the /health UI.
No ENGINE_SECRET required — health endpoint is public.
"""

import time
from importlib.metadata import version as pkg_version

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from config import get_settings
from database.supabase_client import get_supabase
from services.redis_service import ping_redis

router = APIRouter(tags=["Health"])

_START_TIME = time.time()


@router.get("/health/json", include_in_schema=True)
async def health_json() -> JSONResponse:
    """
    Return live health status for all engine dependencies.

    Checks:
    - Supabase DB reachability (lightweight SELECT 1 via RPC)
    - Redis reachability (PING)
    - Active AI provider, model names, LangChain version
    - Optional integrations presence (Slack, GitHub, SendGrid, LangSmith)
    """
    settings = get_settings()

    # ── Supabase check ────────────────────────────────────────────────────────
    db_status = "error"
    try:
        client = get_supabase()
        # Lightest possible query — just confirms the connection is alive
        client.rpc("health_check").execute()
        db_status = "ok"
    except Exception:
        try:
            # Fallback: hit any table with a limit-0 query
            client.table("nudges").select("id").limit(1).execute()
            db_status = "ok"
        except Exception:
            db_status = "error"

    # ── Redis check ───────────────────────────────────────────────────────────
    redis_status = "error"
    try:
        redis_status = "ok" if await ping_redis() else "error"
    except Exception:
        redis_status = "error"

    # ── LangChain version ─────────────────────────────────────────────────────
    try:
        lc_version = pkg_version("langchain")
    except Exception:
        lc_version = "unknown"

    # ── Uptime ────────────────────────────────────────────────────────────────
    elapsed = int(time.time() - _START_TIME)
    hours, remainder = divmod(elapsed, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime = f"{hours}h {minutes}m {seconds}s"

    return JSONResponse(
        content={
            # Core identity
            "engine_version":    "4.0.0",
            "provider":          settings.ai_provider,
            "model":             settings.active_model,
            "fast_model":        settings.active_fast_model,
            "langchain_version": lc_version,
            "uptime":            uptime,

            # Service health
            "database":          db_status,
            "redis":             redis_status,

            # Optional integration presence (bool, not secrets)
            "slack":             bool(settings.slack_webhook_url),
            "sendgrid":          bool(settings.sendgrid_api_key),
            "github_webhook":    bool(settings.github_webhook_secret),
            "tracing":           settings.langchain_tracing_v2,

            # Connection hints (non-sensitive)
            "supabase_url":      settings.supabase_url,
            "redis_url":         settings.redis_url,
        }
    )