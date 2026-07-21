"""
main.py — Nudge Engine v4.0
App factory: registers all routers, owns lifespan (scheduler + Supabase Realtime),
configures CORS, and mounts the /health UI page.
"""
import logging

from fastapi import FastAPI, Request

from contextlib import asynccontextmanager
from importlib.metadata import version as pkg_version
from typing import AsyncGenerator

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from config import get_settings
from middleware.request_logger import RequestLoggerMiddleware

# ── Logging bootstrap ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)

# ── Router imports ────────────────────────────────────────────────────────────

from routers.health_router import router as health_router
from routers.agent_router import router as agent_router
from routers.nudge_router import router as nudge_router
from routers.github_router import router as github_router
from routers.analytics_router import router as analytics_router
from routers.video_call_router import router as video_call_router
from routers.task_router import router as task_router


# ── Infrastructure imports ────────────────────────────────────────────────────

from database.realtime import setup_realtime_subscriptions
from scheduler import setup_scheduler, stop_scheduler

# ── Lifespan ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Handle app startup and shutdown events.
    """
    # Startup
    # 1. Init background jobs
    setup_scheduler()
    
    # 2. Start Realtime listener
    await setup_realtime_subscriptions()
    
    yield
    
    # Shutdown
    stop_scheduler()

# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Nudge Engine",
        description=(
            "AI microservice powering stall detection, nudge generation, "
            "meeting summarization, GitHub event processing, and multi-provider LLM routing."
        ),
        version="4.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Allow the Next.js frontend (port 3000) and NestJS backend (port 4000).
    # Tighten origins in production via an env var if needed.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:4000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request / Response Logger ─────────────────────────────────────────────
    # Prints every inbound request payload and outbound response to stdout.
    # /health and /docs paths are skipped to reduce noise.
    app.add_middleware(RequestLoggerMiddleware)

    # ── Routers ───────────────────────────────────────────────────────────────
    # /health is public (no ENGINE_SECRET required) — all others are protected
    # by the ENGINE_SECRET dependency inside each router.
    app.include_router(health_router)          # GET  /health
    app.include_router(agent_router)           # POST /agent
    app.include_router(nudge_router)           # GET  /nudges
    app.include_router(github_router)          # POST /webhooks/github
    app.include_router(analytics_router)       # GET  /analytics
    app.include_router(video_call_router)      # GET  /video/token
    app.include_router(task_router)            # POST /task/extract




    return app


app = create_app()


# ── /health UI ────────────────────────────────────────────────────────────────

@app.get("/health", response_class=HTMLResponse, include_in_schema=False)
async def health_ui(request: Request) -> HTMLResponse:
    """
    Render a polished browser-based health dashboard.
    The page calls GET /health/json (JSON endpoint in health_router) via
    client-side fetch and renders live status cards — no server-side template
    engine required.
    """
    settings = get_settings()

    try:
        lc_version = pkg_version("langchain")
    except Exception:
        lc_version = "unknown"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nudge Engine · System Health</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    :root {{
      --bg:        #0a0c10;
      --surface:   #111318;
      --border:    #1e2129;
      --accent:    #00e5a0;
      --accent2:   #3b82f6;
      --warn:      #f59e0b;
      --danger:    #ef4444;
      --text:      #e2e8f0;
      --muted:     #64748b;
      --mono:      'JetBrains Mono', monospace;
      --sans:      'Syne', sans-serif;
    }}

    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      min-height: 100vh;
      overflow-x: hidden;
    }}

    /* ── grid noise texture ── */
    body::before {{
      content: '';
      position: fixed; inset: 0;
      background-image:
        linear-gradient(rgba(0,229,160,.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,160,.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }}

    /* ── top bar ── */
    header {{
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem;
      height: 56px;
      background: rgba(10,12,16,.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }}

    .logo {{
      display: flex; align-items: center; gap: .75rem;
      font-size: 1rem; font-weight: 800; letter-spacing: -.01em;
    }}

    .logo-dot {{
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
      animation: pulse 2s ease-in-out infinite;
    }}

    @keyframes pulse {{
      0%,100% {{ opacity: 1; transform: scale(1); }}
      50%      {{ opacity: .5; transform: scale(1.4); }}
    }}

    .timestamp {{
      font-family: var(--mono);
      font-size: .75rem;
      color: var(--muted);
    }}

    /* ── main layout ── */
    main {{
      position: relative; z-index: 1;
      max-width: 1100px;
      margin: 0 auto;
      padding: 3rem 2rem 5rem;
    }}

    h1 {{
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -.03em;
      margin-bottom: .5rem;
    }}

    h1 span {{ color: var(--accent); }}

    .subtitle {{
      color: var(--muted);
      font-size: .9rem;
      margin-bottom: 3rem;
      font-family: var(--mono);
    }}

    /* ── refresh button ── */
    .refresh-btn {{
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .5rem 1.25rem;
      border: 1px solid var(--accent);
      background: transparent;
      color: var(--accent);
      border-radius: 6px;
      font-family: var(--mono);
      font-size: .8rem;
      cursor: pointer;
      transition: background .2s, color .2s;
      margin-bottom: 2.5rem;
    }}
    .refresh-btn:hover {{ background: var(--accent); color: var(--bg); }}

    /* ── status banner ── */
    .banner {{
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem 1.75rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      margin-bottom: 2.5rem;
      background: var(--surface);
      animation: slideIn .4s ease;
    }}

    @keyframes slideIn {{
      from {{ opacity:0; transform: translateY(-10px); }}
      to   {{ opacity:1; transform: translateY(0); }}
    }}

    .banner.ok      {{ border-color: var(--accent);  }}
    .banner.warn    {{ border-color: var(--warn);    }}
    .banner.error   {{ border-color: var(--danger);  }}
    .banner.loading {{ border-color: var(--border);  }}

    .banner-icon {{ font-size: 1.75rem; }}

    .banner-text h2 {{ font-size: 1.1rem; font-weight: 700; }}
    .banner-text p  {{ font-size: .82rem; color: var(--muted); font-family: var(--mono); margin-top: .2rem; }}

    /* ── section headings ── */
    .section-label {{
      font-family: var(--mono);
      font-size: .7rem;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1rem;
      padding-bottom: .5rem;
      border-bottom: 1px solid var(--border);
    }}

    /* ── grid ── */
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }}

    /* ── stat card ── */
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      transition: border-color .2s, transform .2s;
      animation: cardIn .5s ease both;
    }}
    .card:hover {{ border-color: var(--accent); transform: translateY(-2px); }}

    @keyframes cardIn {{
      from {{ opacity:0; transform:translateY(8px); }}
      to   {{ opacity:1; transform:translateY(0); }}
    }}

    .card-label {{
      font-size: .72rem;
      font-family: var(--mono);
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: .6rem;
    }}

    .card-value {{
      font-size: 1.05rem;
      font-weight: 700;
      word-break: break-all;
    }}

    .card-sub {{
      font-size: .78rem;
      color: var(--muted);
      font-family: var(--mono);
      margin-top: .35rem;
    }}

    /* ── status pill ── */
    .pill {{
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .25rem .75rem;
      border-radius: 999px;
      font-size: .75rem;
      font-family: var(--mono);
      font-weight: 500;
    }}
    .pill.ok      {{ background: rgba(0,229,160,.12); color: var(--accent); border: 1px solid rgba(0,229,160,.3); }}
    .pill.warn    {{ background: rgba(245,158,11,.12); color: var(--warn);  border: 1px solid rgba(245,158,11,.3); }}
    .pill.error   {{ background: rgba(239,68,68,.12);  color: var(--danger); border: 1px solid rgba(239,68,68,.3); }}
    .pill.unknown {{ background: rgba(100,116,139,.12); color: var(--muted); border: 1px solid rgba(100,116,139,.3); }}

    .pill-dot {{ width:6px; height:6px; border-radius:50%; background: currentColor; }}

    /* ── services list ── */
    .services {{
      display: flex; flex-direction: column; gap: .75rem;
      margin-bottom: 2.5rem;
    }}

    .service-row {{
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      animation: cardIn .5s ease both;
    }}

    .service-name {{
      font-weight: 600;
      font-size: .9rem;
    }}

    .service-detail {{
      font-family: var(--mono);
      font-size: .75rem;
      color: var(--muted);
      margin-top: .2rem;
    }}

    /* ── footer ── */
    footer {{
      position: relative; z-index: 1;
      text-align: center;
      font-family: var(--mono);
      font-size: .72rem;
      color: var(--muted);
      padding: 1.5rem;
      border-top: 1px solid var(--border);
    }}

    /* ── skeleton shimmer ── */
    .skeleton {{
      background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
      height: 1rem;
    }}
    @keyframes shimmer {{ from {{ background-position: 200% 0; }} to {{ background-position: -200% 0; }} }}
  </style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-dot"></div>
    NUDGE ENGINE
  </div>
  <span class="timestamp" id="clock">—</span>
</header>

<main>
  <h1>System <span>Health</span></h1>
  <p class="subtitle">nudge-engine v4.0.0 · provider: {settings.ai_provider} · langchain {lc_version}</p>

  <button class="refresh-btn" onclick="fetchHealth()">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M23 4v6h-6M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
    Refresh
  </button>

  <!-- ── Status banner ── -->
  <div class="banner loading" id="banner">
    <div class="banner-icon" id="banner-icon">⏳</div>
    <div class="banner-text">
      <h2 id="banner-title">Checking system status…</h2>
      <p id="banner-sub">Fetching live health data from the engine</p>
    </div>
  </div>

  <!-- ── Overview cards ── -->
  <p class="section-label">Overview</p>
  <div class="grid" id="overview-grid">
    <div class="card"><div class="skeleton" style="width:60%;margin-bottom:.8rem"></div><div class="skeleton" style="width:40%"></div></div>
    <div class="card"><div class="skeleton" style="width:60%;margin-bottom:.8rem"></div><div class="skeleton" style="width:40%"></div></div>
    <div class="card"><div class="skeleton" style="width:60%;margin-bottom:.8rem"></div><div class="skeleton" style="width:40%"></div></div>
    <div class="card"><div class="skeleton" style="width:60%;margin-bottom:.8rem"></div><div class="skeleton" style="width:40%"></div></div>
  </div>

  <!-- ── Service checks ── -->
  <p class="section-label">Services</p>
  <div class="services" id="services-list">
    <div class="service-row"><div><div class="skeleton" style="width:120px;height:.9rem;margin-bottom:.4rem"></div><div class="skeleton" style="width:200px;height:.75rem"></div></div><div class="skeleton" style="width:70px;height:1.5rem;border-radius:999px"></div></div>
    <div class="service-row"><div><div class="skeleton" style="width:120px;height:.9rem;margin-bottom:.4rem"></div><div class="skeleton" style="width:200px;height:.75rem"></div></div><div class="skeleton" style="width:70px;height:1.5rem;border-radius:999px"></div></div>
    <div class="service-row"><div><div class="skeleton" style="width:120px;height:.9rem;margin-bottom:.4rem"></div><div class="skeleton" style="width:200px;height:.75rem"></div></div><div class="skeleton" style="width:70px;height:1.5rem;border-radius:999px"></div></div>
  </div>
</main>

<footer>Nudge Engine · AI microservice · <span id="footer-ts">—</span></footer>

<script>
  // ── Clock ──────────────────────────────────────────────────────────────────
  function updateClock() {{
    const now = new Date();
    document.getElementById('clock').textContent =
      now.toLocaleString('en-US', {{ hour12: false, timeZoneName: 'short' }});
    document.getElementById('footer-ts').textContent =
      now.toLocaleDateString('en-US', {{ year: 'numeric', month: 'short', day: 'numeric' }});
  }}
  updateClock();
  setInterval(updateClock, 1000);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function pill(status, label) {{
    const cls = status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : status === 'error' ? 'error' : 'unknown';
    return `<span class="pill ${{cls}}"><span class="pill-dot"></span>${{label || status}}</span>`;
  }}

  function card(label, value, sub) {{
    return `
      <div class="card">
        <div class="card-label">${{label}}</div>
        <div class="card-value">${{value}}</div>
        ${{sub ? `<div class="card-sub">${{sub}}</div>` : ''}}
      </div>`;
  }}

  function serviceRow(name, detail, status, statusLabel) {{
    return `
      <div class="service-row">
        <div>
          <div class="service-name">${{name}}</div>
          <div class="service-detail">${{detail}}</div>
        </div>
        ${{pill(status, statusLabel)}}
      </div>`;
  }}

  // ── Fetch & render ─────────────────────────────────────────────────────────
  async function fetchHealth() {{
    const banner       = document.getElementById('banner');
    const bannerIcon   = document.getElementById('banner-icon');
    const bannerTitle  = document.getElementById('banner-title');
    const bannerSub    = document.getElementById('banner-sub');
    const overviewGrid = document.getElementById('overview-grid');
    const servicesList = document.getElementById('services-list');

    banner.className = 'banner loading';
    bannerTitle.textContent = 'Checking system status…';
    bannerSub.textContent   = 'Fetching live health data from the engine';
    bannerIcon.textContent  = '⏳';

    try {{
      const res  = await fetch('/health/json');
      const data = await res.json();

      // ── Banner ────────────────────────────────────────────────────────────
      const allOk = data.database === 'ok' && data.redis === 'ok';
      if (allOk) {{
        banner.className      = 'banner ok';
        bannerIcon.textContent  = '✅';
        bannerTitle.textContent = 'All systems operational';
        bannerSub.textContent   = `Last checked ${{new Date().toLocaleTimeString()}}`;
      }} else {{
        banner.className      = 'banner warn';
        bannerIcon.textContent  = '⚠️';
        bannerTitle.textContent = 'Degraded — one or more services are unhealthy';
        bannerSub.textContent   = 'Check service details below for specifics';
      }}

      // ── Overview cards ────────────────────────────────────────────────────
      overviewGrid.innerHTML =
        card('AI Provider',   data.provider,       `model: ${{data.model}}`) +
        card('Fast Model',    data.fast_model || '—', 'lightweight tier') +
        card('LangChain',     `v${{data.langchain_version || '—'}}`, 'agent framework') +
        card('Engine',        `v${{data.engine_version || '4.0.0'}}`, `uptime: ${{data.uptime || '—'}}`);

      // ── Services ──────────────────────────────────────────────────────────
      servicesList.innerHTML =
        serviceRow('Supabase DB',   data.supabase_url || 'configured',  data.database, data.database === 'ok' ? 'Connected' : 'Unreachable') +
        serviceRow('Redis',         data.redis_url    || 'configured',  data.redis,    data.redis    === 'ok' ? 'Connected' : 'Unreachable') +
        serviceRow('Slack Webhook', data.slack        ? 'webhook configured' : 'not configured', data.slack ? 'ok' : 'unknown', data.slack ? 'Configured' : 'Not set') +
        serviceRow('GitHub Webhook', data.github_webhook ? 'HMAC secret set' : 'no secret set', data.github_webhook ? 'ok' : 'warn', data.github_webhook ? 'Secured' : 'Unsecured') +
        serviceRow('SendGrid',      data.sendgrid     ? 'key configured' : 'not configured', data.sendgrid ? 'ok' : 'unknown', data.sendgrid ? 'Configured' : 'Not set') +
        serviceRow('LangSmith',     data.tracing      ? 'tracing enabled' : 'tracing disabled', data.tracing ? 'ok' : 'unknown', data.tracing ? 'Active' : 'Off');

    }} catch (err) {{
      banner.className      = 'banner error';
      bannerIcon.textContent  = '🔴';
      bannerTitle.textContent = 'Engine unreachable';
      bannerSub.textContent   = String(err);
      overviewGrid.innerHTML  = '<div class="card" style="grid-column:1/-1;color:var(--danger)">Could not load health data.</div>';
      servicesList.innerHTML  = '';
    }}
  }}

  // ── Auto-fetch on load + every 30 s ───────────────────────────────────────
  fetchHealth();
  setInterval(fetchHealth, 30_000);
</script>
</body>
</html>"""

    return HTMLResponse(content=html)