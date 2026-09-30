from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import FraudFlag, Rule, Transaction
from app.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count(Transaction.id))) or 0
    by_level = dict(db.execute(select(Transaction.risk_level, func.count()).group_by(Transaction.risk_level)).all())
    by_status = dict(db.execute(select(FraudFlag.status, func.count()).group_by(FraudFlag.status)).all())
    flagged = db.scalar(select(func.count(Transaction.id)).where(Transaction.is_flagged.is_(True))) or 0
    active = db.scalar(select(func.count(Rule.id)).where(Rule.enabled.is_(True))) or 0
    return DashboardStats(
        total_transactions=total,
        flagged_transactions=flagged,
        high_risk=by_level.get("HIGH", 0),
        critical=by_level.get("CRITICAL", 0),
        medium_risk=by_level.get("MEDIUM", 0),
        pending_reviews=by_status.get("PENDING", 0),
        reviewed=by_status.get("REVIEWED", 0),
        cleared=by_status.get("CLEARED", 0),
        active_rules=active,
        risk_distribution={lvl: by_level.get(lvl, 0) for lvl in ("LOW", "MEDIUM", "HIGH", "CRITICAL")},
    )
