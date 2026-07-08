import hmac
import hashlib
import logging
from fastapi import APIRouter, Request, Header, HTTPException
from config import get_settings
from agent.agent import run_agent
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Webhooks"])

async def verify_github_signature(request: Request, x_hub_signature_256: str = Header(None)):
    settings = get_settings()
    if not settings.github_webhook_secret:
        return
        
    if not x_hub_signature_256:
        raise HTTPException(status_code=401, detail="X-Hub-Signature-256 missing")
        
    body = await request.body()
    signature = "sha256=" + hmac.new(
        settings.github_webhook_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid GitHub signature")

@router.post("/webhooks/github")
async def handle_github_webhook(request: Request, x_hub_signature_256: str = Header(None)):
    await verify_github_signature(request, x_hub_signature_256)
    
    payload = await request.json()
    event_name = request.headers.get("X-GitHub-Event", "unknown")
    repo_name = payload.get("repository", {}).get("full_name")
    
    supabase = get_supabase()
    res = supabase.table("integrations")\
        .select("workspace_id, project_id")\
        .eq("repo_full_name", repo_name)\
        .eq("provider", "github")\
        .execute()
    
    workspace_id = "global-github"
    project_id = None
    
    if res.data:
        workspace_id = res.data[0]["workspace_id"]
        project_id = res.data[0]["project_id"]

    event = {
        "event_type": "github",
        "workspace_id": workspace_id,
        "project_id": project_id,
        "payload": {
            "event_name": event_name,
            "repository": repo_name,
            "data": payload
        },
        "timestamp": "now"
    }
    
    if project_id:
        print(f"\\n[GITHUB WEBHOOK] Mapped repo '{repo_name}' to Project: {project_id} (Workspace: {workspace_id})\\n")
    else:
        print(f"\\n[GITHUB WEBHOOK WARNING] Repo '{repo_name}' not mapped to any project! Event will run in 'global-github' workspace.\\n")

    await run_agent(event)
    return {"status": "received"}
