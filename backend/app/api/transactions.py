from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models import AuditLog, FraudFlag, Transaction
from app.schemas import AuditLogOut, TransactionCreate, TransactionDetail, TransactionPage
from app.services.transaction_service import process_transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("", response_model=TransactionDetail, status_code=201)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    """Submit a transaction. It is scored by the fraud engine and stored."""
    tx = process_transaction(db, payload, actor="api")
    return _load_detail(db, tx.id)


@router.get("", response_model=TransactionPage)
def list_transactions(
    risk_level: Optional[str] = Query(None, description="LOW | MEDIUM | HIGH | CRITICAL"),
    flagged: Optional[bool] = None,
    customer_id: Optional[str] = None,
    review_status: Optional[str] = Query(None, description="PENDING | REVIEWED | CLEARED"),
    search: Optional[str] = Query(None, description="Matches customer, merchant or city"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = select(Transaction)
    if risk_level:
        q = q.where(Transaction.risk_level == risk_level.upper())
    if flagged is not None:
        q = q.where(Transaction.is_flagged.is_(flagged))
    if customer_id:
        q = q.where(Transaction.customer_id == customer_id)
    if review_status:
        q = q.join(FraudFlag, FraudFlag.transaction_id == Transaction.id).where(
            FraudFlag.status == review_status.upper()
        )
    if search:
        like = f"%{search}%"
        q = q.where(
            Transaction.customer_id.ilike(like) | Transaction.merchant.ilike(like) | Transaction.city.ilike(like)
        )
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    items = db.scalars(
        q.options(selectinload(Transaction.flag))
        .order_by(Transaction.timestamp.desc(), Transaction.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return {"total": total, "items": items}


def _load_detail(db: Session, tx_id: int) -> TransactionDetail:
    tx = db.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    out = TransactionDetail.model_validate(tx)
    keys = [("TRANSACTION", str(tx.id))]
    if tx.flag:
        keys.append(("FLAG", str(tx.flag.id)))
    entries = []
    for etype, eid in keys:
        entries += db.scalars(
            select(AuditLog).where(AuditLog.entity_type == etype, AuditLog.entity_id == eid)
        ).all()
    entries.sort(key=lambda e: (e.created_at, e.id))
    out.audit_trail = [AuditLogOut.model_validate(e) for e in entries]
    return out


@router.get("/{transaction_id}", response_model=TransactionDetail)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Full investigation view: rule results with evidence, reviews and audit timeline."""
    return _load_detail(db, transaction_id)
