"""The core flow: transaction in -> engine -> save -> flag -> audit -> notify."""
import logging
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import FraudFlag, RuleResult, Transaction, utcnow
from app.schemas import TransactionCreate
from app.services import audit, fraud_service, rule_service
from app.services.notification_service import get_notification_service

log = logging.getLogger("fraudlens.tx")

FLAGGED_LEVELS = ("MEDIUM", "HIGH", "CRITICAL")


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def tx_to_dict(t: Transaction) -> dict:
    """Plain-dict form of a transaction (this is what the fraud engine receives)."""
    return {
        "id": t.id,
        "customer_id": t.customer_id,
        "amount": t.amount,
        "currency": t.currency,
        "merchant": t.merchant,
        "category": t.category,
        "city": t.city,
        "country": t.country,
        "latitude": t.latitude,
        "longitude": t.longitude,
        "timestamp": ensure_utc(t.timestamp).isoformat(),
    }


def process_transaction(db: Session, payload: TransactionCreate, actor: str = "system") -> Transaction:
    ts = ensure_utc(payload.timestamp or utcnow())
    tx = Transaction(**payload.model_dump(exclude={"timestamp"}), timestamp=ts)

    # 1. Gather engine inputs: previous transactions of this customer + active rules
    previous = db.scalars(
        select(Transaction)
        .where(Transaction.customer_id == payload.customer_id, Transaction.timestamp <= ts)
        .order_by(Transaction.timestamp.desc())
        .limit(settings.history_limit)
    ).all()
    history = [tx_to_dict(t) for t in reversed(previous)]
    rules = rule_service.active_rules(db)
    names = {r["rule_id"]: r["name"] for r in rules}

    # 2. Ask the fraud engine
    tx_dict = {**payload.model_dump(exclude={"timestamp"}), "timestamp": ts.isoformat()}
    try:
        result = fraud_service.evaluate(tx_dict, history, rules)
    except Exception as exc:
        log.exception("Fraud engine failed")
        raise HTTPException(status_code=500, detail=f"Fraud engine failed: {exc}")

    # 3. Save transaction + rule results (+ flag when suspicious)
    tx.risk_score = result["risk_score"]
    tx.risk_level = result["risk_level"]
    tx.is_flagged = tx.risk_level in FLAGGED_LEVELS
    db.add(tx)
    db.flush()  # assigns tx.id

    for r in result["rule_results"]:
        db.add(
            RuleResult(
                transaction_id=tx.id,
                rule_id=r["rule_id"],
                rule_name=names.get(r["rule_id"]),
                triggered=r["triggered"],
                score=r["score"],
                evidence=r["evidence"],
            )
        )

    audit.log_event(db, "TRANSACTION", tx.id, "TRANSACTION_RECEIVED", actor,
                    {"customer_id": tx.customer_id, "amount": tx.amount})
    audit.log_event(db, "TRANSACTION", tx.id, "FRAUD_EVALUATED", "fraud-engine",
                    {"risk_score": tx.risk_score, "risk_level": tx.risk_level,
                     "engine": fraud_service.engine_name()})

    flag = None
    if tx.is_flagged:
        flag = FraudFlag(transaction_id=tx.id, risk_score=tx.risk_score, risk_level=tx.risk_level)
        db.add(flag)
        db.flush()
        audit.log_event(db, "FLAG", flag.id, "FLAG_CREATED", "fraud-engine",
                        {"transaction_id": tx.id, "risk_level": tx.risk_level})
    db.commit()

    # 4. Notify AFTER commit so a notification problem can never lose the transaction
    notifier = get_notification_service()
    if tx.is_flagged and notifier.should_notify(tx.risk_level):
        triggered = [r for r in db.scalars(select(RuleResult).where(RuleResult.transaction_id == tx.id)).all()
                     if r.triggered]
        outcome = notifier.notify_flagged_transaction(tx, triggered)
        if outcome:
            audit.log_event(db, "FLAG", flag.id, "NOTIFICATION_" + outcome["status"].upper(), "notification-service", outcome)
            db.commit()

    db.refresh(tx)
    return tx
