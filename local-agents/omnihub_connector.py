#!/usr/bin/env python3
"""
OmniHub Connector - Shared module for local agent machines
Provides telemetry emission and task dispatch integration with OmniHub via OmniLink Port.
"""

import os
import sys
import time
import json
import logging
from typing import Any, Dict, Optional, Callable
from datetime import datetime, timezone
import uuid

try:
    import requests
except ImportError:
    print("ERROR: requests library not found. Install with: pip install requests")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class OmniHubEventRejectedException(Exception):
    """Raised when an event is rejected by OmniHub."""
    pass


class OmniHubRetryExhaustedException(Exception):
    """Raised when retry attempts are exhausted."""
    pass


class OmniHubConnector:
    """Client for OmniHub OmniLink Port integration."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        source: str,
        worker_id: str,
        target: Optional[str] = None,
    ):
        """
        Initialize OmniHub connector.

        Args:
            base_url: OmniHub base URL (e.g., https://your-instance.supabase.co/functions/v1)
            api_key: OmniLink API key (omni.xxxxx.yyyyy format)
            source: Source identifier (e.g., "apex-sales", "lead-gen")
            worker_id: Unique worker identifier for this machine
            target: Optional target filter for task claiming (defaults to source)
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.source = source
        self.worker_id = worker_id
        self.target = target or source
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        })

    def emit_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        idempotency_key: Optional[str] = None,
        ts: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Emit a telemetry event to OmniHub.

        Args:
            event_type: Event type (e.g., "lead_ingested", "call_attempted")
            data: Event payload (must be JSON-serializable)
            idempotency_key: Optional idempotency key (auto-generated if None)
            ts: Optional ISO8601 timestamp (defaults to now)

        Returns:
            Response data from OmniHub

        Raises:
            requests.exceptions.RequestException: If the request fails after retries
        """
        if idempotency_key is None:
            idempotency_key = f"{self.source}:{event_type}:{uuid.uuid4()}"

        if ts is None:
            ts = datetime.now(timezone.utc).isoformat()

        payload = {
            "specversion": "1.0",
            "id": str(uuid.uuid4()),
            "source": self.source,
            "type": event_type,
            "time": ts,
            "data": data,
        }

        return self._post_with_retry(
            f"{self.base_url}/omnilink-port/events",
            payload,
            idempotency_key=idempotency_key,
        )

    def claim_task(self) -> Optional[Dict[str, Any]]:
        """
        Attempt to claim one task from OmniHub.

        Returns:
            Task dict with keys: id, type, params, policy OR None if no tasks available

        Raises:
            requests.exceptions.RequestException: If the request fails
        """
        payload = {
            "worker_id": self.worker_id,
            "target": self.target,
        }

        response = self.session.post(
            f"{self.base_url}/omnilink-port/tasks/claim",
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()

        if result.get('status') == 'no_tasks':
            return None

        if result.get('status') == 'claimed':
            return result.get('task')

        logger.warning(f"Unexpected claim response: {result}")
        return None

    def complete_task(
        self,
        task_id: str,
        status: str,
        output: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Mark a task as completed.

        Args:
            task_id: Task UUID
            status: "succeeded" or "failed"
            output: Optional output summary (will be truncated by server if too large)
            error_message: Optional error message (for failed tasks)

        Returns:
            Response data from OmniHub

        Raises:
            requests.exceptions.RequestException: If the request fails
        """
        if status not in ("succeeded", "failed"):
            raise ValueError(f"Invalid status: {status}. Must be 'succeeded' or 'failed'")

        payload = {
            "task_id": task_id,
            "worker_id": self.worker_id,
            "status": status,
        }

        if output is not None:
            payload["output"] = output

        if error_message is not None:
            payload["error_message"] = error_message

        response = self.session.post(
            f"{self.base_url}/omnilink-port/tasks/complete",
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        return response.json()

    def _check_event_result(self, result: Dict[str, Any]) -> bool:
        """
        Check if event result indicates success or requires retry.

        Returns:
            True if should retry, False if successful

        Raises:
            OmniHubEventRejectedException: If event was rejected
        """
        if not result.get('results') or not isinstance(result['results'], list):
            return False  # Success - no results array means direct success response

        first_result = result['results'][0]
        status = first_result.get('status')

        if status in ('queued', 'ingested', 'duplicate'):
            return False  # Success

        if status == 'rate_limited':
            retry_after = first_result.get('retry_after_seconds', 2)
            logger.warning(f"Rate limited, retrying after {retry_after}s")
            time.sleep(retry_after)
            return True  # Should retry

        raise OmniHubEventRejectedException(f"Event rejected: {first_result}")

    def _post_with_retry(
        self,
        url: str,
        payload: Dict[str, Any],
        idempotency_key: str,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Post with exponential backoff retry logic."""
        headers = {'X-Idempotency-Key': idempotency_key}

        for attempt in range(max_retries):
            try:
                response = self.session.post(url, json=payload, headers=headers, timeout=10)
                response.raise_for_status()
                result = response.json()

                should_retry = self._check_event_result(result)
                if not should_retry:
                    return result
                # Continue to next retry if rate limited

            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    backoff = 2 ** attempt
                    logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}), retrying in {backoff}s: {e}")
                    time.sleep(backoff)
                else:
                    logger.error(f"Request failed after {max_retries} attempts: {e}")
                    raise

        raise OmniHubRetryExhaustedException("Retry loop exhausted without success")


class TaskWorker:
    """Task worker loop that claims and executes tasks."""

    def __init__(self, connector: OmniHubConnector, handlers: Dict[str, Callable]):
        """
        Initialize task worker.

        Args:
            connector: OmniHubConnector instance
            handlers: Dict mapping action names to handler functions
                      Handler signature: handler(task: Dict[str, Any]) -> Dict[str, Any]
        """
        self.connector = connector
        self.handlers = handlers
        self.running = False

    def register_handler(self, action: str, handler: Callable):
        """Register a new task handler."""
        self.handlers[action] = handler

    def run(self, poll_interval: int = 5, max_iterations: Optional[int] = None):
        """
        Start the worker loop.

        Args:
            poll_interval: Seconds to wait between claim attempts
            max_iterations: Optional limit on iterations (for testing; None = infinite)
        """
        self.running = True
        iterations = 0

        logger.info(f"TaskWorker starting (worker_id={self.connector.worker_id}, target={self.connector.target})")

        while self.running:
            if max_iterations is not None and iterations >= max_iterations:
                logger.info(f"Reached max iterations ({max_iterations}), stopping")
                break

            iterations += 1

            try:
                task = self.connector.claim_task()

                if task is None:
                    logger.debug("No tasks available")
                    time.sleep(poll_interval)
                    continue

                logger.info(f"Claimed task: {task['id']}")
                self._execute_task(task)

            except KeyboardInterrupt:
                logger.info("Received interrupt, stopping")
                self.running = False
                break

            except Exception as e:
                logger.error(f"Worker loop error: {e}", exc_info=True)
                time.sleep(poll_interval)

        logger.info("TaskWorker stopped")

    def stop(self):
        """Stop the worker loop."""
        self.running = False

    def _execute_task(self, task: Dict[str, Any]):
        """Execute a single task."""
        task_id = task['id']
        params = task.get('params', {})
        action = params.get('action', 'unknown')

        handler = self.handlers.get(action)

        if handler is None:
            logger.warning(f"No handler for action '{action}', marking as failed")
            self.connector.complete_task(
                task_id=task_id,
                status='failed',
                error_message=f"No handler registered for action '{action}'",
            )
            return

        try:
            logger.info(f"Executing task {task_id} with action '{action}'")
            output = handler(task)
            logger.info(f"Task {task_id} succeeded")
            self.connector.complete_task(
                task_id=task_id,
                status='succeeded',
                output=output,
            )

        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}", exc_info=True)
            self.connector.complete_task(
                task_id=task_id,
                status='failed',
                error_message=str(e),
            )


def load_env_config() -> Dict[str, str]:
    """Load OmniHub connector config from environment variables."""
    required = ['OMNIHUB_BASE_URL', 'OMNIHUB_API_KEY', 'OMNIHUB_SOURCE', 'OMNIHUB_WORKER_ID']
    config = {}

    for var in required:
        value = os.getenv(var)
        if not value:
            raise ValueError(f"Required environment variable {var} is not set")
        config[var] = value

    return config


if __name__ == '__main__':
    # Example usage
    print("OmniHub Connector - Shared Module")
    print("Import this module from your local agent scripts.")
    print("\nExample:")
    print("  from omnihub_connector import OmniHubConnector, TaskWorker, load_env_config")
    print("  config = load_env_config()")
    print("  connector = OmniHubConnector(**config)")
    print("  connector.emit_event('test_event', {'foo': 'bar'})")
