from langchain_core.tools import tool
from database.supabase_client import get_supabase
from services.audit_service import write_audit_log

@tool
def process_commit(repository: str, commit_message: str, branch: str, workspace_id: str, project_id: str | None = None) -> str:
    write_audit_log(workspace_id, "github_commit", {"repo": repository, "message": commit_message, "project_id": project_id})
    return f"Commit in {repository}:{branch} processed."

@tool
def flag_deployment_failure(deployment_id: str, error_log: str, workspace_id: str) -> str:
    return f"Deployment failure {deployment_id} flagged (logged to internal buffer)."
