# Nudge Engine v4.0

AI microservice powering stall detection, nudge generation, meeting summarization, and GitHub event processing.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and fill in:
   - `AI_PROVIDER` (claude | gemini | openai)
   - API Keys for your provider
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL`
   - `ENGINE_SECRET` (for internal API auth)

3. **Run the engine:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## 🧪 Testing the APIs

All endpoints (except `/health`) require the `X-Engine-Secret` header.

### 1. Health Check
```bash
curl http://localhost:8000/health/json
```

### 2. Chat with Agent
```bash
curl -X POST http://localhost:8000/agent/chat \
     -H "X-Engine-Secret: your_secret" \
     -H "Content-Type: application/json" \
     -d '{"workspace_id": "ws_123", "content": "How is project X doing?"}'
```

### 3. Summarize Meeting
```bash
curl -X POST http://localhost:8000/meetings/summarize \
     -H "X-Engine-Secret: your_secret" \
     -H "Content-Type: application/json" \
     -d '{
           "workspace_id": "ws_123", 
           "project_id": "prj_456", 
           "transcript": "John: We need to fix the login bug. Sarah: I will take it by Friday."
         }'
```

### 4. Fetch Nudges
```bash
curl -H "X-Engine-Secret: your_secret" http://localhost:8000/nudges/ws_123
```

### 5. GitHub Webhook (Mock)
```bash
curl -X POST http://localhost:8000/webhooks/github \
     -H "X-GitHub-Event: push" \
     -H "Content-Type: application/json" \
     -d '{"repository": {"full_name": "org/repo"}, "commits": [{"message": "Fix login bug"}]}'
```

## 🛠 Project Structure

- `agent/`: LangChain configuration and core loop.
- `tools/`: Callable routines for the AI agent.
- `routers/`: FastAPI endpoints.
- `services/`: Infrastructure (LLM factory, Redis, Audit).
- `database/`: Supabase client and realtime listeners.
- `scheduler.py`: Background jobs (stall detection).
