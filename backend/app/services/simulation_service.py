"""Replay stored transactions with and without a rule - NOTHING is written to the database."""
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Transaction
from app.services import fraud_service, rule_service
from app.services.transaction_service import tx_to_dict


def _counts(levels: list[str]) -> dict:
    return {
        "flagged": sum(1 for l in levels if l != "LOW"),
        "medium": levels.count("MEDIUM"),
        "high": levels.count("HIGH"),
        "critical": levels.count("CRITICAL"),
    }


def simulate(db: Session, candidate: dict, limit: int) -> dict:
    """
    candidate: {rule_id, name, rule_type, config, score}
    BEFORE = the currently enabled rules.  AFTER = same, but with `candidate` switched on.
    """
    rows = db.scalars(
        select(Transaction).order_by(Transaction.timestamp.desc(), Transaction.id.desc())
        .limit(settings.simulation_max_scan)
    ).all()
    rows.reverse()  # chronological
    cutoff = max(0, len(rows) - limit)

    before_rules = rule_service.active_rules(db)
    candidate = {**candidate, "enabled": True}
    after_rules = [r for r in before_rules if r["rule_id"] != candidate["rule_id"]] + [candidate]

    per_customer: dict[str, list[dict]] = defaultdict(list)
    before_levels, after_levels, affected = [], [], []
    triggered_count = evaluated = 0

    for idx, row in enumerate(rows):
        d = tx_to_dict(row)
        history = per_customer[row.customer_id][-settings.history_limit:]
        if idx >= cutoff:
            evaluated += 1
            b = fraud_service.evaluate(d, history, before_rules)
            a = fraud_service.evaluate(d, history, after_rules)
            before_levels.append(b["risk_level"])
            after_levels.append(a["risk_level"])
            mine = next((r for r in a["rule_results"] if r["rule_id"] == candidate["rule_id"]), None)
            hit = bool(mine and mine["triggered"])
            triggered_count += hit
            if hit or a["risk_score"] != b["risk_score"]:
                affected.append(
                    {
                        "transaction_id": row.id,
                        "customer_id": row.customer_id,
                        "amount": row.amount,
                        "timestamp": d["timestamp"],
                        "before_score": b["risk_score"],
                        "before_level": b["risk_level"],
                        "after_score": a["risk_score"],
                        "after_level": a["risk_level"],
                        "rule_triggered": hit,
                        "evidence": mine["evidence"] if mine else None,
                    }
                )
        per_customer[row.customer_id].append(d)

    newly = sum(1 for b, a in zip(before_levels, after_levels) if b == "LOW" and a != "LOW")
    gone = sum(1 for b, a in zip(before_levels, after_levels) if b != "LOW" and a == "LOW")
    changed = sum(1 for x in affected if x["before_score"] != x["after_score"])
    return {
        "rule_id": candidate["rule_id"],
        "transactions_evaluated": evaluated,
        "rule_triggered_count": triggered_count,
        "before": _counts(before_levels),
        "after": _counts(after_levels),
        "newly_flagged": newly,
        "no_longer_flagged": gone,
        "score_changed": changed,
        "affected_transactions": affected[-20:],
    }
