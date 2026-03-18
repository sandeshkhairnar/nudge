from typing import List, Optional
from langchain_core.output_parsers import PydanticOutputParser
from models.schemas import MeetingMOM, ActionItemBase
from pydantic import BaseModel, Field

# --- Meeting Output Parser ---

meeting_parser = PydanticOutputParser(pydantic_object=MeetingMOM)

# --- GitHub Event Analysis Parser ---

class GitHubAnalysisSchema(BaseModel):
    feature: Optional[str] = Field(description="The feature or component impacted")
    developer: str = Field(description="The developer who triggered the event")
    risk_level: str = Field(description="low | medium | high")
    completion_pct: Optional[int] = Field(description="Estimated completion percentage if applicable")

github_parser = PydanticOutputParser(pydantic_object=GitHubAnalysisSchema)

# --- Message Intent Parser ---

class MessageIntentSchema(BaseModel):
    intent: str = Field(description="task_request | question | blocker | general")
    task_title: Optional[str] = Field(description="Inferred title for a new task")
    priority: Optional[str] = Field(description="low | medium | high | urgent")
    assignee_name: Optional[str] = Field(description="Inferred assignee name from mentions or context")

intent_parser = PydanticOutputParser(pydantic_object=MessageIntentSchema)
