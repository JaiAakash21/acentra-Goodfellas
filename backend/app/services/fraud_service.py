"""
Adapter between the backend and the fraud engine.

The rest of the backend ONLY calls `evaluate()` from this file. It uses Member 1's
real engine (`fraud_engine/` at the repo root, exporting `evaluate`) when present,
and falls back to the built-in mock engine otherwise. The engine never touches
the database or AWS.
"""
import logging
import sys
from pathlib import Path

from app.core.config import settings
from app.services import mock_engine
from app.services.mock_engine import score_to_level

log = logging.getLogger("fraudlens.engine")

# backend/app/services/fraud_service.py -> parents[3] is the repository root
_REPO_ROOT = Path(__file__).resolve().parents[3]

_engine_fn = None
_engine_name = "unloaded"


def _load_engine():
    global _engine_fn, _engine_name
    if _engine_fn is not None:
        return _engine_fn
    if not settings.use_mock_engine:
        if str(_REPO_ROOT) not in sys.path:
            sys.path.append(str(_REPO_ROOT))
        try:
            from fraud_engine import evaluate as real_evaluate  # type: ignore

            _engine_fn, _engine_name = real_evaluate, "fraud_engine (Member 1)"
            log.info("Using Member 1 fraud engine")
            return _engine_fn
        except ModuleNotFoundError as exc:
            if exc.name != "fraud_engine":
                raise  # a real import problem inside Member 1's code - show it
            log.warning("fraud_engine package not found - using built-in mock engine")
    _engine_fn, _engine_name = mock_engine.evaluate, "mock_engine (built-in fallback)"
    return _engine_fn


def engine_name() -> str:
    _load_engine()
    return _engine_name


def evaluate(transaction: dict, history: list, rules: list) -> dict:
    """Run the engine and normalise its answer to the shared contract."""
    raw = _load_engine()(transaction, history, rules)
    results = []
    for r in raw.get("rule_results", []):
        results.append(
            {
                "rule_id": str(r["rule_id"]),
                "triggered": bool(r.get("triggered", False)),
                "score": int(r.get("score", 0)),
                "evidence": str(r.get("evidence", "")),
            }
        )
    score = max(0, min(100, int(raw.get("risk_score", 0))))
    level = str(raw.get("risk_level") or score_to_level(score)).upper()
    if level not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
        level = score_to_level(score)
    return {"risk_score": score, "risk_level": level, "rule_results": results}
