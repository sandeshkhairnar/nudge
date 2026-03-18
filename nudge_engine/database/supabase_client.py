"""
database/supabase_client.py — Nudge Engine v4.0
Singleton Supabase client using the service-role key.
Shared across all tools and routers. Never expose this client to the frontend.
"""

from functools import lru_cache

from supabase import Client, create_client, create_async_client

from config import get_settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Return the singleton Supabase service-role client.
    Cached after first call — bypasses RLS, for internal engine use only.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

async def get_async_supabase():
    """
    Return async Supabase client, needed for realtime subscriptions.
    """
    settings = get_settings()
    return await create_async_client(settings.supabase_url, settings.supabase_service_role_key)