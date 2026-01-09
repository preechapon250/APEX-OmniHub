# MAN Mode: Manual Approval Node Safety Gate

MAN Mode is a safety gate that intercepts high-risk agent actions before execution,
requiring human approval for sensitive operations.

## Overview

When an agent attempts to execute a tool that could have irreversible or sensitive effects,
MAN Mode evaluates the risk and creates an approval task if necessary.

### Risk Lanes

| Lane | Description | Action |
|------|-------------|--------|
| `GREEN` | Safe tools (read-only) | Auto-approved, no human intervention |
| `YELLOW` | Unknown tools | Logged for audit, auto-approved |
| `RED` | Sensitive tools | **Requires human approval** |
| `BLOCKED` | Prohibited tools | Rejected immediately |

## Activities

### risk_triage

Evaluate risk level of proposed action.

**Input**: ActionIntent (tool_name, params, workflow_id, step_id, irreversible, context)
**Output**: RiskTriageResult (lane, reason, requires_approval, risk_factors, suggested_timeout_hours)
**Retryable**: No (validation errors)

### create_man_task

Persist approval task to database and send push notifications.

**Input**: workflow_id, step_id, intent, triage_result, timeout_hours
**Output**: task_id, idempotency_key, status, created, notification_sent
**Retryable**: Yes (transient DB issues)
**Idempotent**: Yes (uses idempotency_key)

Notifications are only sent on NEW task creation, not on activity retries.

### resolve_man_task

Update task with human decision.

**Input**: task_id, status (APPROVED/DENIED), reason, decided_by, metadata
**Output**: success, task_id, status, workflow_id
**Retryable**: Yes (transient DB issues)

### get_man_task

Retrieve task status for polling or decision checking.

**Input**: task_id OR idempotency_key
**Output**: found, task
**Retryable**: Yes (transient DB issues)

### check_man_decision

Lightweight check for workflow polling.

**Input**: task_id
**Output**: decided, status, reason
**Retryable**: Yes

### notify_man_task

Standalone activity for manually triggering notifications.

**Input**: task_id, workflow_id, step_id, intent, triage_result, expires_at
**Output**: success, channels_attempted, channels_succeeded, errors
**Retryable**: Yes (transient network errors)

## Push Notifications

MAN Mode includes a multi-channel notification service for alerting operators when approval tasks are created.

### Supported Channels

| Channel | Description | Configuration |
|---------|-------------|---------------|
| `console` | Logs to stdout (development) | Default, always available |
| `slack` | Slack Block Kit messages | `MAN_SLACK_WEBHOOK_URL` |
| `webhook` | Generic HTTP POST | `MAN_NOTIFICATION_WEBHOOK_URL` |
| `email` | Email via HTTP endpoint | `MAN_EMAIL_NOTIFICATION_ENDPOINT` |

### Configuration

```bash
# Comma-separated list of enabled channels
MAN_NOTIFICATION_CHANNELS=slack,webhook,console

# Channel endpoints
MAN_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
MAN_NOTIFICATION_WEBHOOK_URL=https://your-api.com/webhooks/man
MAN_EMAIL_NOTIFICATION_ENDPOINT=https://your-email-service.com/send

# Dashboard URL for action buttons
MAN_DASHBOARD_URL=https://apex.app/man/tasks
```

### Design Principles

1. **Idempotent**: Notifications only sent on NEW task creation, not on activity retries
2. **Fire-and-Forget**: Notification failures are logged but don't block task creation
3. **Multi-Channel**: Sends to all enabled channels concurrently
4. **Graceful Degradation**: Missing channel configuration fails silently

### Slack Message Format

Slack notifications use Block Kit with:
- Header with risk lane emoji (🔴 RED, 🟡 YELLOW)
- Tool name and workflow context
- Risk factors list
- "Review in Dashboard" action button

### Manual Notification Trigger

For custom notification flows or re-sending:

```python
await workflow.execute_activity(
    notify_man_task,
    {
        "task_id": "...",
        "workflow_id": "...",
        "step_id": "...",
        "intent": {"tool_name": "...", "params": {}},
        "triage_result": {"lane": "RED", "reason": "..."}
    }
)
```

## Test Coverage

**60 unit tests** covering:

- Enum validation (ManLane, ManTaskStatus)
- Model immutability and validation
- Policy triage for all 4 lanes
- Case-insensitive tool matching
- High-risk parameter detection
- Large amount detection (≥$10,000)
- Custom policy configuration
- Performance optimizations (cached lowercase sets)
- Edge cases (empty names, special characters, thresholds)
- Notification channel parsing and configuration
- Slack Block Kit message formatting
- Email payload formatting with priority
- Multi-channel concurrent notification delivery
- Idempotent notification behavior

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Agent Saga    │────▶│   risk_triage   │────▶│ ManPolicy       │
│   Workflow      │     │   Activity      │     │ (Risk Engine)   │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼ (if RED lane)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ create_man_task │────▶│ NotificationSvc │────▶│ Slack/Webhook/  │
│   Activity      │     │ (Fire-and-Forget)     │ Email/Console   │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼ (wait for signal)
┌─────────────────┐     ┌─────────────────┐
│ resolve_man_task│────▶│   Dashboard     │
│   Activity      │◀────│   (Human UI)    │
└─────────────────┘     └─────────────────┘
```

## Files

| File | Description |
|------|-------------|
| `models/man_mode.py` | Pydantic models (ActionIntent, ManTask, etc.) |
| `policies/man_policy.py` | Risk classification engine |
| `activities/man_mode.py` | Temporal activities |
| `services/notifications.py` | Multi-channel notification service |
| `tests/test_man_mode.py` | Unit tests (31 tests) |
| `tests/test_notifications.py` | Notification tests (29 tests) |
