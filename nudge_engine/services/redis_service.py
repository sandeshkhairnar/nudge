

import json
import time
from typing import Any

import asyncio
import redis.asyncio as redis
from config import get_settings

# ── Client ────────────────────────────────────────────────────────────────────

_redis: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Return (and lazily create) the shared async Redis client."""
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def ping_redis() -> bool:
    """Return True if Redis is reachable, False otherwise. Used by /health."""
    try:
        return await get_redis().ping()
    except Exception:
        return False


# ── Key helpers ───────────────────────────────────────────────────────────────

def _rate_limit_key(workspace_id: str) -> str:
    return f"nudge:ratelimit:{workspace_id}"


def _memory_key(workspace_id: str) -> str:
    return f"nudge:memory:{workspace_id}"


def _idempotency_key(event_id: str) -> str:
    return f"nudge:idempotency:{event_id}"


# ── Rate limiting ─────────────────────────────────────────────────────────────

async def check_rate_limit(workspace_id: str) -> bool:
    """
    Sliding-window rate limit: max RATE_LIMIT_CALLS_PER_HOUR AI calls per
    workspace per hour.

    Returns True if the call is allowed, False if the limit is exceeded.
    Increments the counter on every allowed call.
    """
    settings = get_settings()
    key = _rate_limit_key(workspace_id)
    r = get_redis()

    now = int(time.time())
    window_start = now - 3600  # 1-hour sliding window

    pipe = r.pipeline()
    # Remove entries outside the window
    pipe.zremrangebyscore(key, "-inf", window_start)
    # Count remaining entries
    pipe.zcard(key)
    # Add this call with current timestamp as both score and member
    pipe.zadd(key, {str(now): now})
    # Expire the key after 1 hour of inactivity
    pipe.expire(key, 3600)
    results = await pipe.execute()

    call_count = results[1]  # zcard result (before adding current call)
    return call_count < settings.rate_limit_calls_per_hour


async def get_rate_limit_usage(workspace_id: str) -> dict[str, int]:
    """Return current usage and limit for a workspace (for health/analytics)."""
    settings = get_settings()
    key = _rate_limit_key(workspace_id)
    r = get_redis()

    now = int(time.time())
    await r.zremrangebyscore(key, "-inf", now - 3600)
    used = await r.zcard(key)

    return {
        "used": used,
        "limit": settings.rate_limit_calls_per_hour,
        "remaining": max(0, settings.rate_limit_calls_per_hour - used),
    }


# ── Conversation memory ───────────────────────────────────────────────────────

async def get_memory(workspace_id: str) -> list[dict[str, Any]]:
    """
    Load serialized conversation turns for a workspace.
    Returns an empty list if no memory exists yet.
    """
    key = _memory_key(workspace_id)
    raw = await get_redis().get(key)
    if not raw:
        return []
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []


async def set_memory(workspace_id: str, turns: list[dict[str, Any]]) -> None:
    """
    Persist conversation turns for a workspace with a 24-hour TTL.
    Trims to the last MEMORY_WINDOW_K turns before saving.
    """
    settings = get_settings()
    key = _memory_key(workspace_id)
    # Keep only the most recent window
    trimmed = turns[-settings.memory_window_k:]
    await get_redis().set(key, json.dumps(trimmed), ex=settings.memory_ttl_seconds)


async def clear_memory(workspace_id: str) -> None:
    """Delete conversation memory for a workspace (e.g. on explicit reset)."""
    await get_redis().delete(_memory_key(workspace_id))


# ── Idempotency ───────────────────────────────────────────────────────────────

async def is_duplicate_event(event_id: str, ttl_seconds: int = 86_400) -> bool:
    """
    Check whether an event has already been processed (webhook deduplication).
    Marks the event as seen on first call. Returns True if it's a duplicate.
    """
    key = _idempotency_key(event_id)
    r = get_redis()
    # SET NX — only sets if the key doesn't exist; returns True on success
    is_new = await r.set(key, "1", ex=ttl_seconds, nx=True)
    return not is_new  # duplicate if we could NOT set (key already existed)