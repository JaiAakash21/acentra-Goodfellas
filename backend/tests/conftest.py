import os

# Use a throw-away SQLite file so tests never touch your PostgreSQL data.
os.environ["DATABASE_URL"] = "sqlite:///./test_fraudlens.db"
os.environ["NOTIFICATION_PROVIDER"] = "mock"
os.environ["USE_MOCK_ENGINE"] = "false"


import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as c:  # runs startup -> creates tables + default rules
        yield c
