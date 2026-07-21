"""
middleware/request_logger.py — Nudge Engine Request Logger

Logs every incoming API request and its response to stdout in a clean,
color-coded format that is easy to follow in the terminal:

  ┌─ → POST /agent  [workspace: abc-123]
  │   PAYLOAD: { "event_type": "message", ... }
  └─ ← 200 OK  (143 ms)
     RESPONSE: { "status": "success", ... }

Color codes:
  - Cyan    : method + path
  - Green   : 2xx responses
  - Yellow  : 4xx responses
  - Red     : 5xx responses or errors
  - Magenta : request payload
  - Blue    : response body
"""

import json
import time
import logging
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger("nudge.api")

# ── ANSI colour helpers ────────────────────────────────────────────────────────
RESET   = "\033[0m"
BOLD    = "\033[1m"
CYAN    = "\033[36m"
GREEN   = "\033[32m"
YELLOW  = "\033[33m"
RED     = "\033[31m"
MAGENTA = "\033[35m"
BLUE    = "\033[34m"
GRAY    = "\033[90m"

def _color_status(status: int) -> str:
    code = str(status)
    if status < 300:
        return f"{GREEN}{BOLD}{code}{RESET}"
    elif status < 500:
        return f"{YELLOW}{BOLD}{code}{RESET}"
    else:
        return f"{RED}{BOLD}{code}{RESET}"

def _pretty(obj) -> str:
    """Pretty-print a dict/list, truncate if huge."""
    try:
        text = json.dumps(obj, indent=2, default=str)
        if len(text) > 4000:
            text = text[:4000] + f"\n{GRAY}  ... (truncated){RESET}"
        return text
    except Exception:
        s = str(obj)
        return s[:4000] if len(s) > 4000 else s

# ── Paths to skip (health polling, etc.) ──────────────────────────────────────
SKIP_PATHS = {"/health", "/health/json", "/docs", "/redoc", "/openapi.json"}


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that logs:
      1. Method + path + headers of interest
      2. Request body (JSON parsed where possible)
      3. Response status + body (JSON parsed where possible)
      4. Elapsed time in ms
    """

    def __init__(self, app: ASGIApp, skip_paths: set[str] | None = None):
        super().__init__(app)
        self.skip_paths = skip_paths or SKIP_PATHS

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in self.skip_paths:
            return await call_next(request)

        # ── 1. Read + cache request body ──────────────────────────────────────
        body_bytes = await request.body()

        async def receive():
            return {"type": "http.request", "body": body_bytes, "more_body": False}

        request._receive = receive  # type: ignore[attr-defined]

        # Parse payload
        payload_display = ""
        if body_bytes:
            try:
                payload_obj = json.loads(body_bytes)
                payload_display = _pretty(payload_obj)
            except Exception:
                payload_display = body_bytes.decode("utf-8", errors="replace")[:4000]

        # Workspace hint (look inside body or query params)
        workspace_hint = ""
        try:
            parsed = json.loads(body_bytes) if body_bytes else {}
            wid = parsed.get("workspace_id") or parsed.get("workspace_uuid")
            if wid:
                workspace_hint = f"  {GRAY}workspace: {wid}{RESET}"
        except Exception:
            pass

        # ── 2. Print request banner ───────────────────────────────────────────
        sep = f"{GRAY}{'─' * 60}{RESET}"
        print(f"\n{sep}")
        print(
            f"{CYAN}{BOLD}→ {request.method}{RESET}  "
            f"{CYAN}{request.url.path}{RESET}"
            f"{workspace_hint}"
        )
        if request.url.query:
            print(f"   {GRAY}query: {request.url.query}{RESET}")
        if payload_display:
            print(f"   {MAGENTA}PAYLOAD:{RESET}")
            for line in payload_display.splitlines():
                print(f"     {line}")

        # ── 3. Execute handler ────────────────────────────────────────────────
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed = int((time.perf_counter() - start) * 1000)
            print(
                f"   {RED}{BOLD}✗ EXCEPTION{RESET}  {RED}{exc}{RESET}  "
                f"{GRAY}({elapsed} ms){RESET}"
            )
            print(sep)
            raise

        elapsed = int((time.perf_counter() - start) * 1000)

        # ── 4. Read response body (non-streaming only) ────────────────────────
        response_body = b""
        if not isinstance(response, StreamingResponse):
            async for chunk in response.body_iterator:  # type: ignore[attr-defined]
                response_body += chunk if isinstance(chunk, bytes) else chunk.encode()

            # Rebuild the response so the client still gets the body
            response = Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        # Parse response
        response_display = ""
        if response_body:
            try:
                resp_obj = json.loads(response_body)
                response_display = _pretty(resp_obj)
            except Exception:
                response_display = response_body.decode("utf-8", errors="replace")[:4000]

        # ── 5. Print response banner ──────────────────────────────────────────
        status_str = _color_status(response.status_code)
        print(
            f"   {BLUE}{BOLD}← {status_str}{RESET}  "
            f"{GRAY}({elapsed} ms){RESET}"
        )
        if response_display:
            print(f"   {BLUE}RESPONSE:{RESET}")
            for line in response_display.splitlines():
                print(f"     {line}")
        print(sep)

        return response
