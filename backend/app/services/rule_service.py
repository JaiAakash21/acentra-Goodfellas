from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Rule

DEFAULT_RULES = [
    dict(
        rule_id="VEL001", name="Transaction Velocity", rule_type="VELOCITY", score=30, enabled=True,
        is_builtin=True,
        description="More than N transactions within a time window.",
        config={"window_minutes": 10, "max_transactions": 5},
    ),
    dict(
        rule_id="AMT001", name="Unusual Transaction Amount", rule_type="AMOUNT", score=25, enabled=True,
        is_builtin=True,
        description="Amount is many times higher than the customer's historical average.",
        config={"multiplier": 5, "min_history": 3},
    ),
    dict(
        rule_id="GEO001", name="Impossible Geographical Location", rule_type="GEOGRAPHY", score=30,
        enabled=True, is_builtin=True,
        description="Travel speed between two transactions is physically impossible.",
        config={"max_speed_kmh": 900, "min_distance_km": 100},
    ),
    # Sample dynamic rule for the Rule Studio demo. Disabled until someone enables it.
    dict(
        rule_id="NIGHT001", name="Night-time High Value Transfer", rule_type="CONDITION", score=30,
        enabled=False, is_builtin=False,
        description="Amount > 50,000 between 00:00 and 03:59 (IST).",
        config={
            "match": "all",
            "conditions": [
                {"field": "amount", "op": ">", "value": 50000},
                {"field": "hour", "op": "between", "value": [0, 3]},
            ],
        },
    ),
]


def ensure_default_rules(db: Session) -> None:
    """Insert the default rules if missing (never overwrites edits)."""
    existing = set(db.scalars(select(Rule.rule_id)).all())
    for spec in DEFAULT_RULES:
        if spec["rule_id"] not in existing:
            db.add(Rule(**spec))
    db.commit()


def rule_to_dict(rule: Rule) -> dict:
    return {
        "rule_id": rule.rule_id,
        "name": rule.name,
        "rule_type": rule.rule_type,
        "config": rule.config or {},
        "score": rule.score,
        "enabled": rule.enabled,
    }


def active_rules(db: Session) -> list[dict]:
    rules = db.scalars(select(Rule).where(Rule.enabled.is_(True)).order_by(Rule.id)).all()
    return [rule_to_dict(r) for r in rules]
