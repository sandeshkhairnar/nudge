from typing import Optional, Any
from pydantic import BaseModel

class MessagePayload(BaseModel):
    workspace_id: str
    project_id: Optional[str] = None
    channel_id: str
    user_id: str
    content: str
    is_ai: bool

class ChatPayload(BaseModel):
    workspace_id: str
    content: str

class StallPayload(BaseModel):
    task_id: str
    task_title: str
    stalled_days: int
    assignee_id: Optional[str] = None

class GitHubPayload(BaseModel):
    event_name: str
    repository: str
    sender: str
    action: Optional[str] = None
    data: dict[str, Any]

class AgentEvent(BaseModel):
    """
    Standard event payload passed to run_agent().
    """
    event_type: str  # message | stall | github | meeting | cron
    workspace_id: str
    project_id: Optional[str] = None
    payload: dict[str, Any]
    timestamp: str
