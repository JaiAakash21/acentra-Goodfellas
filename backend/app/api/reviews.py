from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models import FraudFlag, Review, Transaction, utcnow
from app.schemas import ReviewAction, ReviewCaseOut, ReviewOut, RuleResultOut, TransactionOut
from app.services import audit

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# action -> statuses it may start from
ALLOWED_FROM = {"REVIEWED": {"PENDING"}, "CLEARED": {"PENDING", "REVIEWED"}}


def _case(flag: FraudFlag) -> ReviewCaseOut:
    tx = flag.transaction
    return ReviewCaseOut(
        flag_id=flag.id,
        status=flag.status,
        risk_score=flag.risk_score,
        risk_level=flag.risk_level,
        created_at=flag.created_at,
        reviewed_by=flag.reviewed_by,
        reviewed_at=flag.reviewed_at,
        transaction=TransactionOut.model_validate(tx),
        triggered_rules=[RuleResultOut.model_validate(r) for r in tx.rule_results if r.triggered],
        reviews=[ReviewOut.model_validate(r) for r in flag.reviews],
    )


def _query(status: Optional[str], risk_level: Optional[str]):
    q = select(FraudFlag).options(
        selectinload(FraudFlag.transaction).selectinload(Transaction.rule_results),
        selectinload(FraudFlag.transaction).selectinload(Transaction.flag),
        selectinload(FraudFlag.reviews),
    )
    if status:
        q = q.where(FraudFlag.status == status.upper())
    if risk_level:
        q = q.where(FraudFlag.risk_level == risk_level.upper())
    return q.order_by(FraudFlag.risk_score.desc(), FraudFlag.created_at.desc(), FraudFlag.id.desc())


@router.get("/pending", response_model=list[ReviewCaseOut])
def pending_reviews(
    risk_level: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Suspicious cases waiting for a reviewer, highest risk first."""
    return [_case(f) for f in db.scalars(_query("PENDING", risk_level).offset(skip).limit(limit)).all()]


@router.get("", response_model=list[ReviewCaseOut])
def list_reviews(
    status: Optional[str] = Query(None, description="PENDING | REVIEWED | CLEARED"),
    risk_level: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return [_case(f) for f in db.scalars(_query(status, risk_level).offset(skip).limit(limit)).all()]


@router.get("/{flag_id}", response_model=ReviewCaseOut)
def get_review(flag_id: int, db: Session = Depends(get_db)):
    flag = db.scalars(_query(None, None).where(FraudFlag.id == flag_id)).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Case not found")
    return _case(flag)


def _apply(db: Session, flag_id: int, action: str, payload: Optional[ReviewAction]) -> ReviewCaseOut:
    payload = payload or ReviewAction()
    flag = db.scalars(_query(None, None).where(FraudFlag.id == flag_id)).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Case not found")
    if flag.status not in ALLOWED_FROM[action]:
        raise HTTPException(status_code=409, detail=f"Case is already {flag.status}; cannot mark it {action}")
    old = flag.status
    flag.status = action
    flag.reviewed_by = payload.reviewer
    flag.reviewed_at = utcnow()
    db.add(Review(fraud_flag_id=flag.id, reviewer=payload.reviewer, action=action, comment=payload.comment))
    audit.log_event(db, "FLAG", flag.id, f"CASE_{action}", payload.reviewer,
                    {"from": old, "to": action, "comment": payload.comment})
    db.commit()
    db.refresh(flag)
    return _case(flag)


@router.post("/{flag_id}/review", response_model=ReviewCaseOut)
def mark_reviewed(flag_id: int, payload: Optional[ReviewAction] = None, db: Session = Depends(get_db)):
    """MARK REVIEWED button. `flag_id` is the case id (`flag_id` in the pending list)."""
    return _apply(db, flag_id, "REVIEWED", payload)


@router.post("/{flag_id}/clear", response_model=ReviewCaseOut)
def clear_case(flag_id: int, payload: Optional[ReviewAction] = None, db: Session = Depends(get_db)):
    """CLEAR button - the reviewer decided this is not fraud."""
    return _apply(db, flag_id, "CLEARED", payload)
