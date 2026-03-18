from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
from models.events import AgentEvent, MessagePayload, ChatPayload
from agent.agent import run_agent, run_agent_stream
from config import get_settings

router = APIRouter(prefix="/agent", tags=["Agent"])

async def verify_secret(x_engine_secret: str = Header(...)):
    settings = get_settings()
    if x_engine_secret != settings.engine_secret:
        raise HTTPException(status_code=403, detail="Invalid ENGINE_SECRET")

@router.post("")
async def handle_agent_event(event: AgentEvent, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    result = await run_agent(event.model_dump())
    return {"status": "success", "result": result}

@router.post("/message")
async def handle_message_request(payload: MessagePayload, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    event = {
        "event_type": "message",
        "workspace_id": payload.workspace_id,
        "project_id": payload.project_id,
        "payload": payload.model_dump(),
        "timestamp": "now"
    }
    result = await run_agent(event)
    return {"status": "success", "result": result}

@router.post("/chat")
async def handle_dashboard_chat(payload: ChatPayload, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    event = {
        "event_type": "chat",
        "workspace_id": payload.workspace_id,
        "payload": payload.model_dump(),
        "timestamp": "now"
    }
    result = await run_agent(event)
    return {"status": "success", "output": result}

@router.post("/chat/stream")
async def handle_dashboard_chat_stream(payload: ChatPayload, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    event = {
        "event_type": "chat",
        "workspace_id": payload.workspace_id,
        "payload": payload.model_dump(),
        "timestamp": "now"
    }
    
    async def stream_generator():
        async for token in run_agent_stream(event):
            yield token

    return StreamingResponse(stream_generator(), media_type="text/plain")
