import httpx
import logging
from langchain_core.tools import tool
from config import get_settings
from services.audit_service import write_audit_log

logger = logging.getLogger(__name__)

@tool
def slack_notify(channel: str, text: str, workspace_id: str) -> str:
    """
    Send a notification message to a Slack channel.
    """
    settings = get_settings()
    if not settings.slack_webhook_url:
        return "Slack notifications are not configured."

    try:
        with httpx.Client() as client:
            res = client.post(settings.slack_webhook_url, json={
                "channel": channel,
                "text": text
            })
            res.raise_for_status()
            
        # Audit log
        write_audit_log(workspace_id, "slack_notified", {"channel": channel, "message": text[:50]})
        
        return "Slack notification sent."
    except Exception as e:
        logger.error(f"Slack notification failed: {e}")
        return f"Failed to send Slack notification: {e}"

@tool
def email_notify(to_email: str, subject: str, body: str, workspace_id: str) -> str:
    """
    Send an email notification via SendGrid.
    """
    settings = get_settings()
    if not settings.sendgrid_api_key:
        return "SendGrid is not configured."

    # Placeholder for SendGrid implementation
    logger.info(f"Email sent to {to_email}: {subject}")
    write_audit_log(workspace_id, "email_sent", {"to": to_email, "subject": subject})
    
    return "Email notification simulated (SendGrid placeholder)."
