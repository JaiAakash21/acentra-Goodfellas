from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models import AuditLog


def log_event(
    db: Session,
    entity_type: str,
    entity_id: Any,
    action: str,
    actor: str = "system",
    details: Optional[dict] = None,
) -> None:
    """Add an audit entry to the current session (caller commits)."""
    db.add(
        AuditLog(
            entity_type=entity_type,
            entity_id=str(entity_id),
            action=action,
            actor=actor,
            details=details,
        )
    )
