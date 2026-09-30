import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend directory is in sys.path when running from repo root
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app import models  # noqa: F401  (registers tables on Base.metadata)

from app.api import audit, dashboard, demo, health, reviews, rules, transactions
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.services import rule_service, seed_data

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # creates missing tables (hackathon-friendly, no migrations)
    with SessionLocal() as db:
        rule_service.ensure_default_rules(db)
        if settings.auto_seed and not db.scalar(select(func.count(models.Transaction.id))):
            seed_data.seed_demo_data(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for FraudLens - Explainable Dynamic Fraud Decision & Review Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (health, transactions, rules, reviews, dashboard, audit, demo):
    app.include_router(module.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    return {"message": "FraudLens API is running. See /docs for Swagger UI."}
