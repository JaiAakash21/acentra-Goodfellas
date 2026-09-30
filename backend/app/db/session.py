import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

log = logging.getLogger("fraudlens.db")

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

try:
    engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=_connect_args)
    if not settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            pass
except Exception as exc:
    log.warning("Could not connect to %s (%s). Falling back to sqlite:///./fraudlens.db", settings.database_url, exc)
    engine = create_engine("sqlite:///./fraudlens.db", pool_pre_ping=True, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    """FastAPI dependency: one DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

