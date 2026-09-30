"""Synthetic (fake) transactions for the demo. NOT real banking data."""
import random
import uuid
from typing import Optional
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import AuditLog, FraudFlag, Review, RuleResult, Transaction
from app.schemas import TransactionCreate
from app.services.transaction_service import process_transaction

IST = timezone(timedelta(hours=5, minutes=30))

CITIES = {
    "Chennai": (13.0827, 80.2707, "India"),
    "Mumbai": (19.0760, 72.8777, "India"),
    "Bengaluru": (12.9716, 77.5946, "India"),
    "Delhi": (28.6139, 77.2090, "India"),
    "London": (51.5074, -0.1278, "UK"),
}
MERCHANTS = ["BigBazaar", "Amazon", "Swiggy", "Zomato", "IndianOil", "Reliance Digital", "Uber", "BookMyShow"]
CATEGORIES = ["grocery", "online", "food", "fuel", "electronics", "travel", "entertainment"]


def _tx(rng, customer, city, amount, ts, jitter=True) -> TransactionCreate:
    lat, lon, country = CITIES[city]
    if jitter:
        lat += rng.uniform(-0.02, 0.02)
        lon += rng.uniform(-0.02, 0.02)
    return TransactionCreate(
        customer_id=customer, amount=round(amount, 2), currency="INR",
        merchant=rng.choice(MERCHANTS), category=rng.choice(CATEGORIES),
        city=city, country=country, latitude=round(lat, 5), longitude=round(lon, 5), timestamp=ts,
    )


def _baseline(rng, customer, city, n, base_amount, end):
    """`n` ordinary transactions in one city, spaced >= 6h apart, all before `end`."""
    out, t = [], end - timedelta(hours=6)
    for _ in range(n):
        out.append(_tx(rng, customer, city, base_amount * rng.uniform(0.8, 1.2), t))
        t -= timedelta(hours=rng.uniform(8, 20))
    return out


# ---------------------------------------------------------------- scenarios
def normal(rng, customer, now):
    city = rng.choice(["Chennai", "Mumbai", "Bengaluru", "Delhi"])
    return _baseline(rng, customer, city, rng.randint(6, 10), rng.uniform(800, 3000), now - timedelta(hours=1))


def velocity(rng, customer, now):
    out = _baseline(rng, customer, "Chennai", 6, 1500, now - timedelta(hours=1))
    t = now - timedelta(minutes=9)
    for _ in range(7):  # 7 transactions in ~7 minutes
        out.append(_tx(rng, customer, "Chennai", rng.uniform(400, 900), t))
        t += timedelta(seconds=rng.randint(55, 80))
    return out


def amount(rng, customer, now):
    out = _baseline(rng, customer, "Mumbai", 6, 1500, now - timedelta(hours=1))
    out.append(_tx(rng, customer, "Mumbai", 65000, now - timedelta(minutes=2)))
    return out


def geography(rng, customer, now):
    out = _baseline(rng, customer, "Chennai", 5, 1500, now - timedelta(hours=1))
    out.append(_tx(rng, customer, "Chennai", 1200, now - timedelta(minutes=10)))
    out.append(_tx(rng, customer, "London", 1500, now - timedelta(minutes=6)))  # 4 minutes later!
    return out


def combined(rng, customer, now):
    """Chennai burst, then a big London purchase minutes later -> velocity + amount + geography."""
    out = _baseline(rng, customer, "Chennai", 6, 2000, now - timedelta(hours=1))
    t = now - timedelta(minutes=9)
    for _ in range(6):
        out.append(_tx(rng, customer, "Chennai", 2000, t, jitter=False))
        t += timedelta(seconds=55)
    out.append(_tx(rng, customer, "London", 14600, now - timedelta(minutes=1)))
    return out


def night(rng, customer, now):
    """High-value customer sends 55,000 at 02:10 IST. Only the NIGHT001 rule catches it."""
    local = now.astimezone(IST)
    when = (local - timedelta(days=1)).replace(hour=2, minute=10, second=0, microsecond=0).astimezone(timezone.utc)
    out = _baseline(rng, customer, "Delhi", 6, 40000, when - timedelta(hours=1))
    out.append(_tx(rng, customer, "Delhi", 55000, when))
    return out


SCENARIOS = {
    "velocity": velocity, "amount": amount, "geography": geography,
    "combined": combined, "night": night,
}


def build_scenario(name: str, now: Optional[datetime] = None, customer: Optional[str] = None):
    now = now or datetime.now(timezone.utc)
    customer = customer or f"CUST-{name[:3].upper()}-{uuid.uuid4().hex[:4].upper()}"
    return SCENARIOS[name](random.Random(), customer, now)


def _process_all(db: Session, payloads: list[TransactionCreate]) -> int:
    for p in sorted(payloads, key=lambda x: x.timestamp):  # chronological, like real life
        process_transaction(db, p, actor="seed")
    return len(payloads)


def run_scenario(db: Session, name: str) -> list[Transaction]:
    payloads = build_scenario(name)
    _process_all(db, payloads)
    last = max(payloads, key=lambda x: x.timestamp)
    return db.scalars(select(Transaction).where(Transaction.customer_id == last.customer_id)
                      .order_by(Transaction.timestamp)).all()


def reset_data(db: Session) -> None:
    """Delete transactions & results (rules are kept)."""
    for model in (Review, FraudFlag, RuleResult, AuditLog, Transaction):
        db.execute(delete(model))
    db.commit()


def seed_demo_data(db: Session, reset: bool = False) -> dict:
    if reset:
        reset_data(db)
    elif db.scalar(select(func.count(Transaction.id))):
        return {"seeded": False, "message": "Transactions already exist. Use reset=true to reseed."}

    rng, now = random.Random(42), datetime.now(timezone.utc)
    payloads: list[TransactionCreate] = []
    for i in range(1, 9):
        payloads += normal(rng, f"CUST-{1000 + i}", now)
    plan = {"velocity": 2, "amount": 2, "geography": 2, "combined": 2, "night": 1}
    for name, count in plan.items():
        for i in range(1, count + 1):
            payloads += SCENARIOS[name](rng, f"CUST-{name[:3].upper()}-{i}", now)
    total = _process_all(db, payloads)
    return {"seeded": True, "transactions_created": total}
