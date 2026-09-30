from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Rule
from app.schemas import (
    DraftSimulationRequest,
    RuleCreate,
    RuleOut,
    RuleUpdate,
    SimulationRequest,
    SimulationResult,
    _validate_config,
)
from app.services import audit, rule_service, simulation_service

router = APIRouter(prefix="/rules", tags=["Rules"])


def _get_rule(db: Session, rule_id: str) -> Rule:
    rule = db.scalar(select(Rule).where(Rule.rule_id == rule_id))
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    return rule


@router.get("", response_model=list[RuleOut])
def list_rules(enabled: Optional[bool] = None, db: Session = Depends(get_db)):
    q = select(Rule).order_by(Rule.id)
    if enabled is not None:
        q = q.where(Rule.enabled.is_(enabled))
    return db.scalars(q).all()


@router.post("", response_model=RuleOut, status_code=201)
def create_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    """Add a new fraud rule. No change to the fraud engine code is needed."""
    if db.scalar(select(Rule).where(Rule.rule_id == payload.rule_id)):
        raise HTTPException(status_code=409, detail=f"Rule {payload.rule_id} already exists")
    rule = Rule(**payload.model_dump(), is_builtin=False)
    db.add(rule)
    db.flush()
    audit.log_event(db, "RULE", rule.rule_id, "RULE_CREATED", "api", payload.model_dump())
    db.commit()
    return rule


# NOTE: this static path must be declared before "/{rule_id}" routes.
@router.post("/simulate", response_model=SimulationResult)
def simulate_draft_rule(payload: DraftSimulationRequest, db: Session = Depends(get_db)):
    """Try a rule that has NOT been saved yet against stored transactions (nothing is written)."""
    r = payload.rule
    candidate = {"rule_id": r.rule_id, "name": r.name, "rule_type": r.rule_type,
                 "config": r.config, "score": r.score}
    return simulation_service.simulate(db, candidate, payload.limit)


@router.get("/{rule_id}", response_model=RuleOut)
def get_rule(rule_id: str, db: Session = Depends(get_db)):
    return _get_rule(db, rule_id)


@router.put("/{rule_id}", response_model=RuleOut)
def update_rule(rule_id: str, payload: RuleUpdate, db: Session = Depends(get_db)):
    """Edit a rule or enable/disable it (`{"enabled": false}`)."""
    rule = _get_rule(db, rule_id)
    changes = payload.model_dump(exclude_unset=True)
    if "config" in changes:
        try:
            _validate_config(rule.rule_type, changes["config"])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    before = {k: getattr(rule, k) for k in changes}
    for key, value in changes.items():
        setattr(rule, key, value)
    audit.log_event(db, "RULE", rule.rule_id, "RULE_UPDATED", "api", {"before": before, "after": changes})
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/{rule_id}/simulate", response_model=SimulationResult)
def simulate_rule(rule_id: str, payload: Optional[SimulationRequest] = None, db: Session = Depends(get_db)):
    """What would happen if this rule were enabled (optionally with a different config/score)?"""
    payload = payload or SimulationRequest()
    rule = _get_rule(db, rule_id)
    candidate = rule_service.rule_to_dict(rule)
    if payload.config is not None:
        candidate["config"] = payload.config
    if payload.score is not None:
        candidate["score"] = payload.score
    return simulation_service.simulate(db, candidate, payload.limit)
