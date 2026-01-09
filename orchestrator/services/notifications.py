"""
MAN Mode Notification Service.

Sends push notifications when MAN tasks are created, requiring human approval.
Supports multiple channels: webhook, Slack, email.

Design Principles:
- Fire-and-forget: Notification failures don't block task creation
- Configurable: Channel settings via environment variables
- Extensible: Easy to add new notification channels
"""

import asyncio
import os
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

import httpx
from pydantic import BaseModel, Field


class NotificationChannel(str, Enum):
    """Supported notification channels."""

    WEBHOOK = "webhook"
    SLACK = "slack"
    EMAIL = "email"
    CONSOLE = "console"


class NotificationPayload(BaseModel):
    """Payload for MAN task notifications."""

    task_id: str
    workflow_id: str
    step_id: str
    tool_name: str
    lane: str  # RED, YELLOW
    reason: str
    risk_factors: list[str] = Field(default_factory=list)
    params_summary: Optional[str] = None
    expires_at: Optional[str] = None
    dashboard_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NotificationResult(BaseModel):
    """Result of a notification attempt."""

    channel: NotificationChannel
    success: bool
    error: Optional[str] = None
    response_code: Optional[int] = None


class NotificationService:
    """
    Multi-channel notification service for MAN Mode approval tasks.

    Supports:
    - Webhook: Generic HTTP POST to any endpoint
    - Slack: Slack Incoming Webhooks with Block Kit formatting
    - Email: HTTP-based email service integration
    - Console: stdout logging for development

    Configuration via environment variables:
    - MAN_NOTIFICATION_CHANNELS: Comma-separated list of enabled channels
    - MAN_NOTIFICATION_WEBHOOK_URL: Webhook endpoint URL
    - MAN_SLACK_WEBHOOK_URL: Slack incoming webhook URL
    - MAN_EMAIL_NOTIFICATION_ENDPOINT: Email service endpoint
    - MAN_DASHBOARD_URL: Base URL for approval dashboard
    """

    def __init__(self) -> None:
        """Initialize notification service with configuration from environment."""
        # Parse enabled channels
        channels_str = os.getenv("MAN_NOTIFICATION_CHANNELS", "console")
        self.enabled_channels: list[NotificationChannel] = []
        for ch in channels_str.split(","):
            ch = ch.strip().lower()
            try:
                self.enabled_channels.append(NotificationChannel(ch))
            except ValueError:
                pass  # Skip invalid channels

        # Default to console if no valid channels
        if not self.enabled_channels:
            self.enabled_channels = [NotificationChannel.CONSOLE]

        # Channel-specific configuration
        self.webhook_url = os.getenv("MAN_NOTIFICATION_WEBHOOK_URL")
        self.slack_webhook_url = os.getenv("MAN_SLACK_WEBHOOK_URL")
        self.email_endpoint = os.getenv("MAN_EMAIL_NOTIFICATION_ENDPOINT")
        self.dashboard_base_url = os.getenv("MAN_DASHBOARD_URL", "https://apex.app/man/tasks")

        # HTTP client (lazy initialized)
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def notify_task_created(
        self,
        task_id: str,
        workflow_id: str,
        step_id: str,
        intent: dict[str, Any],
        triage_result: dict[str, Any],
        expires_at: Optional[str] = None,
    ) -> list[NotificationResult]:
        """
        Send notifications for a newly created MAN task.

        Args:
            task_id: Unique task identifier
            workflow_id: Parent workflow ID
            step_id: Step within workflow
            intent: ActionIntent dict
            triage_result: RiskTriageResult dict
            expires_at: ISO timestamp when task expires

        Returns:
            List of NotificationResult for each channel attempted
        """
        # Build payload
        dashboard_url = self._build_dashboard_url(task_id)
        payload = NotificationPayload(
            task_id=task_id,
            workflow_id=workflow_id,
            step_id=step_id,
            tool_name=intent.get("tool_name", "unknown"),
            lane=triage_result.get("lane", "YELLOW"),
            reason=triage_result.get("reason", "Requires approval"),
            risk_factors=triage_result.get("risk_factors", []),
            params_summary=self._summarize_params(intent.get("params", {})),
            expires_at=expires_at,
            dashboard_url=dashboard_url,
        )

        # Send to all enabled channels concurrently
        tasks = []
        for channel in self.enabled_channels:
            if channel == NotificationChannel.WEBHOOK:
                tasks.append(self._send_webhook(payload))
            elif channel == NotificationChannel.SLACK:
                tasks.append(self._send_slack(payload))
            elif channel == NotificationChannel.EMAIL:
                tasks.append(self._send_email(payload))
            elif channel == NotificationChannel.CONSOLE:
                tasks.append(self._send_console(payload))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to failed results
        final_results: list[NotificationResult] = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                channel = self.enabled_channels[i]
                final_results.append(
                    NotificationResult(
                        channel=channel,
                        success=False,
                        error=str(result),
                    )
                )
            else:
                final_results.append(result)

        return final_results

    def _build_dashboard_url(self, task_id: str) -> str:
        """Build dashboard URL for task."""
        return f"{self.dashboard_base_url}/{task_id}"

    def _format_risk_factors(self, factors: list[str]) -> str:
        """Format risk factors for display."""
        if not factors:
            return "  None identified"
        return "\n".join(f"  - {f}" for f in factors)

    def _summarize_params(self, params: dict[str, Any]) -> str:
        """Create a summary of action parameters."""
        if not params:
            return "No parameters"
        # Show first few keys
        keys = list(params.keys())[:5]
        if len(params) > 5:
            return f"{', '.join(keys)} (+{len(params) - 5} more)"
        return ", ".join(keys)

    # =========================================================================
    # Channel Implementations
    # =========================================================================

    async def _send_webhook(self, payload: NotificationPayload) -> NotificationResult:
        """Send notification via generic webhook."""
        if not self.webhook_url:
            return NotificationResult(
                channel=NotificationChannel.WEBHOOK,
                success=False,
                error="Webhook URL not configured",
            )

        try:
            client = await self._get_client()
            response = await client.post(
                self.webhook_url,
                json=payload.model_dump(),
                headers={"Content-Type": "application/json"},
            )
            return NotificationResult(
                channel=NotificationChannel.WEBHOOK,
                success=response.is_success,
                response_code=response.status_code,
                error=None if response.is_success else response.text[:200],
            )
        except Exception as e:
            return NotificationResult(
                channel=NotificationChannel.WEBHOOK,
                success=False,
                error=str(e),
            )

    async def _send_slack(self, payload: NotificationPayload) -> NotificationResult:
        """Send notification via Slack webhook."""
        if not self.slack_webhook_url:
            return NotificationResult(
                channel=NotificationChannel.SLACK,
                success=False,
                error="Slack webhook URL not configured",
            )

        try:
            message = self._format_slack_message(payload)
            client = await self._get_client()
            response = await client.post(
                self.slack_webhook_url,
                json=message,
                headers={"Content-Type": "application/json"},
            )
            return NotificationResult(
                channel=NotificationChannel.SLACK,
                success=response.is_success,
                response_code=response.status_code,
                error=None if response.is_success else response.text[:200],
            )
        except Exception as e:
            return NotificationResult(
                channel=NotificationChannel.SLACK,
                success=False,
                error=str(e),
            )

    def _format_slack_message(self, payload: NotificationPayload) -> dict[str, Any]:
        """Format Slack Block Kit message."""
        lane_emoji = ":red_circle:" if payload.lane == "RED" else ":large_yellow_circle:"

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{lane_emoji} MAN Mode Approval Required",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Tool:*\n`{payload.tool_name}`"},
                    {"type": "mrkdwn", "text": f"*Lane:*\n{payload.lane}"},
                    {"type": "mrkdwn", "text": f"*Workflow:*\n`{payload.workflow_id}`"},
                    {"type": "mrkdwn", "text": f"*Task ID:*\n`{payload.task_id}`"},
                ],
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Reason:*\n{payload.reason}",
                },
            },
        ]

        # Add risk factors if present
        if payload.risk_factors:
            factors_text = "\n".join(f"- {f}" for f in payload.risk_factors)
            blocks.append(
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Risk Factors:*\n{factors_text}",
                    },
                }
            )

        # Add action button
        if payload.dashboard_url:
            blocks.append(
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Review in Dashboard",
                                "emoji": True,
                            },
                            "url": payload.dashboard_url,
                            "style": "primary",
                        }
                    ],
                }
            )

        return {"blocks": blocks}

    async def _send_email(self, payload: NotificationPayload) -> NotificationResult:
        """Send notification via email service."""
        if not self.email_endpoint:
            return NotificationResult(
                channel=NotificationChannel.EMAIL,
                success=False,
                error="Email endpoint not configured",
            )

        try:
            email_payload = self._format_email_payload(payload)
            client = await self._get_client()
            response = await client.post(
                self.email_endpoint,
                json=email_payload,
                headers={"Content-Type": "application/json"},
            )
            return NotificationResult(
                channel=NotificationChannel.EMAIL,
                success=response.is_success,
                response_code=response.status_code,
                error=None if response.is_success else response.text[:200],
            )
        except Exception as e:
            return NotificationResult(
                channel=NotificationChannel.EMAIL,
                success=False,
                error=str(e),
            )

    def _format_email_payload(self, payload: NotificationPayload) -> dict[str, Any]:
        """Format email notification payload."""
        subject = f"[{payload.lane}] MAN Mode Approval Required: {payload.tool_name}"
        risk_factors_text = self._format_risk_factors(payload.risk_factors)

        body = f"""MAN Mode Approval Required

Tool: {payload.tool_name}
Lane: {payload.lane}
Workflow: {payload.workflow_id}
Task ID: {payload.task_id}

Reason: {payload.reason}

Risk Factors:
{risk_factors_text}

Expires: {payload.expires_at or "Not set"}

Review: {payload.dashboard_url or "Dashboard URL not configured"}
"""

        return {
            "subject": subject,
            "body": body,
            "priority": "high" if payload.lane == "RED" else "normal",
            "task_id": payload.task_id,
        }

    async def _send_console(self, payload: NotificationPayload) -> NotificationResult:
        """Log notification to console (for development)."""
        # Build risk factors section
        if payload.risk_factors:
            factors_lines = "\n".join(f"║    {f:<60} ║" for f in payload.risk_factors)
        else:
            factors_lines = "║    None identified                                             ║"

        dashboard = payload.dashboard_url or "Not configured"

        print(f"""
╔══════════════════════════════════════════════════════════════════╗
║  MAN MODE APPROVAL REQUIRED                                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Tool:     {payload.tool_name:<52} ║
║  Lane:     {payload.lane:<52} ║
║  Workflow: {payload.workflow_id:<52} ║
║  Task ID:  {payload.task_id:<52} ║
╠══════════════════════════════════════════════════════════════════╣
║  Reason: {payload.reason:<54} ║
║                                                                  ║
║  Risk Factors:                                                   ║
{factors_lines}
╠══════════════════════════════════════════════════════════════════╣
║  Dashboard: {dashboard:<51} ║
╚══════════════════════════════════════════════════════════════════╝
""")
        return NotificationResult(
            channel=NotificationChannel.CONSOLE,
            success=True,
        )


# Global singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get or create the global notification service instance."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
