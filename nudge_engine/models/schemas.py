from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field

# --- Nudges ---

class NudgeBase(BaseModel):
    workspace_id: str
    project_id: str
    task_id: str
    content: str
    severity: str = "low"  # low | medium | high | critical

class NudgeCreate(NudgeBase):
    pass

class Nudge(NudgeBase):
    id: str
    created_at: datetime
    dismissed: bool = False
    dismissed_at: Optional[datetime] = None

class NudgeDismissRequest(BaseModel):
    nudge_id: str

# --- Meetings ---

class ActionItemBase(BaseModel):
    assignee_id: str
    task_title: str
    due_date: Optional[datetime] = None

class MeetingSummarizeRequest(BaseModel):
    workspace_id: str
    project_id: str
    transcript: str

class MeetingMOM(BaseModel):
    summary: str
    key_decisions: List[str]
    action_items: List[ActionItemBase]

# --- Analytics ---

class ProjectAnalytics(BaseModel):
    workspace_id: str
    project_id: str
    health_score: float
    summary: str
    active_nudges_count: int
    stalled_tasks_count: int

# --- Health ---

class HealthResponse(BaseModel):
    engine_version: str
    provider: str
    model: str
    fast_model: Optional[str] = None
    langchain_version: str
    uptime: str
    database: str
    redis: str
    slack: bool
    sendgrid: bool
    github_webhook: bool
    tracing: bool
    supabase_url: str
    redis_url: str
