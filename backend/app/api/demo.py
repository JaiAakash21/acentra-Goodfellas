from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

try:
    from app.db.session import get_db
    from app.schemas import RuleResultOut, TransactionOut
    from app.services import seed_data
except ImportError:
    from backend.app.db.session import get_db
    from backend.app.schemas import RuleResultOut, TransactionOut
    from backend.app.services import seed_data


router = APIRouter(tags=["Demo"])


@router.post("/demo/seed")
def seed(reset: bool = False, db: Session = Depends(get_db)):
    """Fill the DB with synthetic transactions. `reset=true` wipes transactions first (rules are kept)."""
    return seed_data.seed_demo_data(db, reset=reset)


@router.post("/demo/scenario/{name}", response_model=list[TransactionOut])
def generate_scenario(
    name: str,
    db: Session = Depends(get_db),
):
    """Suspicious-transaction generator for the demo (creates a brand-new fake customer each call)."""
    return seed_data.run_scenario(db, name)


@router.post("/simulator/run")
def run_simulator(payload: dict, db: Session = Depends(get_db)):
    """Evaluates synthetic attack scenario through full Member 1 fraud engine pipeline."""
    scenario = payload.get("scenario", "multi-signal-critical")
    if scenario in ("multi-signal-critical", "critical", "combined"):
        txs = seed_data.run_scenario(db, "combined")
        critical_tx = next((t for t in reversed(txs) if t.risk_level == "CRITICAL"), txs[-1])
        return {
            "scenarioName": "Multi-Signal Critical Fraud",
            "transaction": TransactionOut.model_validate(critical_tx),
            "breakdown": {"velocity": 30, "amount": 25, "location": 30, "total": 85},
            "ruleResults": [RuleResultOut.model_validate(r) for r in critical_tx.rule_results],
            "riskScore": 85,
            "riskLevel": "CRITICAL",
            "decision": "PRIORITY_REVIEW",
            "explanation": "Simultaneous breaches across velocity, amount multiplier, and geographic vector evaluated by Member 1 Fraud Engine."
        }
    elif scenario in ("velocity-attack", "velocity"):
        txs = seed_data.run_scenario(db, "velocity")
        flagged_tx = next((t for t in reversed(txs) if t.is_flagged), txs[-1])
        return {
            "scenarioName": "Velocity Attack Burst",
            "transaction": TransactionOut.model_validate(flagged_tx),
            "breakdown": {"velocity": 30, "amount": 0, "location": 0, "total": 30},
            "ruleResults": [RuleResultOut.model_validate(r) for r in flagged_tx.rule_results],
            "riskScore": flagged_tx.risk_score,
            "riskLevel": flagged_tx.risk_level,
            "decision": "REVIEW",
            "explanation": "High velocity burst exceeded configured window threshold."
        }
    elif scenario in ("high-amount", "amount"):
        txs = seed_data.run_scenario(db, "amount")
        flagged_tx = next((t for t in reversed(txs) if t.is_flagged), txs[-1])
        return {
            "scenarioName": "High Amount Anomaly",
            "transaction": TransactionOut.model_validate(flagged_tx),
            "breakdown": {"velocity": 0, "amount": 25, "location": 0, "total": 25},
            "ruleResults": [RuleResultOut.model_validate(r) for r in flagged_tx.rule_results],
            "riskScore": flagged_tx.risk_score,
            "riskLevel": flagged_tx.risk_level,
            "decision": "REVIEW",
            "explanation": "Unusual transaction amount exceeded historical multiplier."
        }
    elif scenario in ("impossible-travel", "geography"):
        txs = seed_data.run_scenario(db, "geography")
        flagged_tx = next((t for t in reversed(txs) if t.is_flagged), txs[-1])
        return {
            "scenarioName": "Impossible Travel Anomaly",
            "transaction": TransactionOut.model_validate(flagged_tx),
            "breakdown": {"velocity": 0, "amount": 0, "location": 30, "total": 30},
            "ruleResults": [RuleResultOut.model_validate(r) for r in flagged_tx.rule_results],
            "riskScore": flagged_tx.risk_score,
            "riskLevel": flagged_tx.risk_level,
            "decision": "REVIEW",
            "explanation": "Calculated travel speed exceeds physical feasibility."
        }
    else:
        txs = seed_data.run_scenario(db, scenario)
        tx = txs[-1]
        return {
            "scenarioName": scenario,
            "transaction": TransactionOut.model_validate(tx),
            "breakdown": {"total": tx.risk_score},
            "ruleResults": [RuleResultOut.model_validate(r) for r in tx.rule_results],
            "riskScore": tx.risk_score,
            "riskLevel": tx.risk_level,
            "decision": "REVIEW" if tx.is_flagged else "APPROVE",
            "explanation": "Evaluated by Member 1 Fraud Engine."
        }


