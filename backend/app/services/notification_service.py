"""
Notifications. The fraud engine never imports this; only the API layer does.

Providers:  MockProvider (default, logs to console) | SNSProvider | SESProvider
Switch with NOTIFICATION_PROVIDER=mock|sns|ses in .env. AWS providers import boto3
lazily, so the app runs fine without boto3 or AWS credentials.
"""
import logging
from abc import ABC, abstractmethod
from functools import lru_cache
from typing import Optional

from app.core.config import settings

log = logging.getLogger("fraudlens.notify")


class NotificationProvider(ABC):
    name = "base"

    @abstractmethod
    def send(self, subject: str, message: str) -> dict:
        ...


class MockProvider(NotificationProvider):
    name = "mock"

    def __init__(self):
        self.sent: list[dict] = []

    def send(self, subject: str, message: str) -> dict:
        log.warning("[MOCK NOTIFICATION] %s\n%s", subject, message)
        self.sent.append({"subject": subject, "message": message})
        return {"provider": self.name, "status": "logged"}


class SNSProvider(NotificationProvider):
    name = "sns"

    def __init__(self):
        import boto3  # lazy import

        if not settings.sns_topic_arn:
            raise ValueError("SNS_TOPIC_ARN is not set")
        self.client = boto3.client("sns", region_name=settings.aws_region)

    def send(self, subject: str, message: str) -> dict:
        resp = self.client.publish(TopicArn=settings.sns_topic_arn, Subject=subject[:100], Message=message)
        return {"provider": self.name, "status": "sent", "message_id": resp.get("MessageId")}


class SESProvider(NotificationProvider):
    name = "ses"

    def __init__(self):
        import boto3  # lazy import

        if not settings.ses_sender or not settings.ses_recipients:
            raise ValueError("SES_SENDER and SES_RECIPIENTS must be set")
        self.client = boto3.client("ses", region_name=settings.aws_region)

    def send(self, subject: str, message: str) -> dict:
        resp = self.client.send_email(
            Source=settings.ses_sender,
            Destination={"ToAddresses": settings.ses_recipients},
            Message={"Subject": {"Data": subject}, "Body": {"Text": {"Data": message}}},
        )
        return {"provider": self.name, "status": "sent", "message_id": resp.get("MessageId")}


class NotificationService:
    def __init__(self, provider: NotificationProvider):
        self.provider = provider

    def should_notify(self, risk_level: str) -> bool:
        return risk_level in settings.notify_levels

    def notify_flagged_transaction(self, tx, triggered_results: list) -> Optional[dict]:
        """Send an alert for a HIGH/CRITICAL transaction. Never raises."""
        if not self.should_notify(tx.risk_level):
            return None
        subject = f"[FraudLens] {tx.risk_level} risk transaction #{tx.id} (score {tx.risk_score})"
        lines = [
            f"Customer : {tx.customer_id}",
            f"Amount   : {tx.amount:,.2f} {tx.currency}",
            f"Location : {tx.city or 'unknown'}",
            f"Time     : {tx.timestamp}",
            "",
            "Why it was flagged:",
        ]
        lines += [f"  - [{r.rule_id}] +{r.score}: {r.evidence}" for r in triggered_results]
        try:
            return self.provider.send(subject, "\n".join(lines))
        except Exception as exc:  # a notification failure must never break ingestion
            log.error("Notification failed: %s", exc)
            return {"provider": self.provider.name, "status": "failed", "error": str(exc)}


@lru_cache
def get_notification_service() -> NotificationService:
    choice = settings.notification_provider.lower()
    try:
        provider = {"sns": SNSProvider, "ses": SESProvider}.get(choice, MockProvider)()
    except Exception as exc:
        log.warning("Could not start %s provider (%s) - falling back to mock", choice, exc)
        provider = MockProvider()
    return NotificationService(provider)
