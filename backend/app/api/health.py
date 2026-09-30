from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services import fraud_service

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        database = "connected"
    except Exception as exc:
        database = f"error: {exc}"
    return {
        "status": "ok" if database == "connected" else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "database": database,
        "fraud_engine": fraud_service.engine_name(),
        "notification_provider": settings.notification_provider,
    }
