from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut

router = APIRouter(tags=["Audit"])


@router.get("/audit", response_model=list[AuditLogOut])
@router.get("/audit-log", response_model=list[AuditLogOut])
def list_audit_log(

    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Newest first. Example: /api/audit-log?action=NOTIFICATION_LOGGED"""
    q = select(AuditLog).order_by(AuditLog.id.desc()).limit(limit)
    if entity_type:
        q = q.where(AuditLog.entity_type == entity_type.upper())
    if entity_id:
        q = q.where(AuditLog.entity_id == entity_id)
    if action:
        q = q.where(AuditLog.action == action.upper())
    return db.scalars(q).all()
