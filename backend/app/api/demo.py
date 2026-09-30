from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import TransactionOut
from app.services import seed_data

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/seed")
def seed(reset: bool = False, db: Session = Depends(get_db)):
    """Fill the DB with synthetic transactions. `reset=true` wipes transactions first (rules are kept)."""
    return seed_data.seed_demo_data(db, reset=reset)


@router.post("/scenario/{name}", response_model=list[TransactionOut])
def generate_scenario(
    name: Literal["velocity", "amount", "geography", "combined", "night"],
    db: Session = Depends(get_db),
):
    """Suspicious-transaction generator for the demo (creates a brand-new fake customer each call)."""
    return seed_data.run_scenario(db, name)
