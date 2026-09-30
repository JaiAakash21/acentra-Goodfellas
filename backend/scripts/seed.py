"""Load demo data:   python -m scripts.seed            (only if DB is empty)
                     python -m scripts.seed --reset    (wipe transactions, then reseed)"""
import sys

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app import models  # noqa: F401
from app.services import rule_service, seed_data


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        rule_service.ensure_default_rules(db)
        print(seed_data.seed_demo_data(db, reset="--reset" in sys.argv))


if __name__ == "__main__":
    main()
