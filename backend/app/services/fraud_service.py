"""
FraudLens Adapter: Connects FastAPI backend with Member 1's Fraud Engine.

Pipeline:
FastAPI -> app/services/fraud_service.py -> Member 1 FraudEngine -> RuleRegistry -> GenericEvaluator
-> Rules (VEL001, AMT001, GEO001, Condition rules) -> RiskAggregator -> FraudDecision -> DB persistence.

The fraud engine remains independent of database, FastAPI, AWS, and HTTP.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union

try:
    from backend.app.engine.engine import FraudEngine
    from backend.app.engine.models import (
        Transaction as EngineTransaction,
        RuleResult as EngineRuleResult,
        FraudDecision,
        RiskLevel,
    )
    from backend.app.rules.base import BaseRule
    from backend.app.rules.velocity import TransactionVelocityRule
    from backend.app.rules.amount import UnusualAmountRule
    from backend.app.rules.geography import ImpossibleGeographyRule
except ImportError:
    from app.engine.engine import FraudEngine
    from app.engine.models import (
        Transaction as EngineTransaction,
        RuleResult as EngineRuleResult,
        FraudDecision,
        RiskLevel,
    )
    from app.rules.base import BaseRule
    from app.rules.velocity import TransactionVelocityRule
    from app.rules.amount import UnusualAmountRule
    from app.rules.geography import ImpossibleGeographyRule

log = logging.getLogger("fraudlens.engine")

LOCAL_UTC_OFFSET_MINUTES = 330  # India Standard Time (UTC+5:30)


class DynamicConditionRule(BaseRule):
    """
    Extends Member 1's BaseRule architecture to support arbitrary declarative
    condition rules (e.g. NIGHT001) from Member 2's PostgreSQL rules table.
    """

    def __init__(self, rule_id: str, rule_name: str):
        self._rule_id = rule_id
        self._rule_name = rule_name

    @property
    def rule_id(self) -> str:
        return self._rule_id

    @property
    def rule_name(self) -> str:
        return self._rule_name

    def evaluate(
        self, transaction: EngineTransaction, context: Dict[str, Any], config: Dict[str, Any]
    ) -> EngineRuleResult:
        weight = int(config.get("weight", config.get("score", 30)))
        match_all = config.get("match", "all") == "all"
        conditions = config.get("conditions", [])

        if not conditions:
            return EngineRuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence="No conditions specified in rule configuration.",
                transaction_id=transaction.id,
            )

        parts, hits = [], []
        for c in conditions:
            field = c.get("field")
            op = c.get("op")
            expected = c.get("value")

            if field == "hour":
                local_time = transaction.timestamp + timedelta(minutes=LOCAL_UTC_OFFSET_MINUTES)
                actual = local_time.hour
            elif field == "day_of_week":
                local_time = transaction.timestamp + timedelta(minutes=LOCAL_UTC_OFFSET_MINUTES)
                actual = local_time.weekday()
            elif field in ("customer_id", "account_id"):
                actual = transaction.account_id
            elif field == "amount":
                actual = transaction.amount
            elif field == "currency":
                actual = transaction.currency
            elif field in ("city", "location_name"):
                actual = transaction.location_name
            elif field == "merchant":
                actual = transaction.merchant
            else:
                actual = getattr(transaction, field, None)

            ok = self._compare(actual, op, expected)
            hits.append(ok)
            parts.append(f"{field} {op} {expected} (actual {actual})")

        triggered = bool(hits) and (all(hits) if match_all else any(hits))
        score = weight if triggered else 0
        label = "Matched all" if match_all else "Matched any"
        evidence = (f"{label}: " if triggered else "Not matched: ") + "; ".join(parts)

        return EngineRuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            score=score,
            evidence=evidence,
            transaction_id=transaction.id,
        )

    def _compare(self, actual: Any, op: str, expected: Any) -> bool:
        if actual is None:
            return False
        if isinstance(actual, str):
            actual = actual.lower()
            expected = (
                [str(e).lower() for e in expected]
                if isinstance(expected, list)
                else str(expected).lower()
            )
        if op == ">":
            return actual > expected
        if op == ">=":
            return actual >= expected
        if op == "<":
            return actual < expected
        if op == "<=":
            return actual <= expected
        if op == "==":
            return actual == expected
        if op == "!=":
            return actual != expected
        if op == "in":
            return actual in expected
        if op == "between":
            lo, hi = expected
            return (lo <= actual <= hi) if lo <= hi else (actual >= lo or actual <= hi)
        return False


# Singleton engine instance
_engine_instance: Optional[FraudEngine] = None


def get_engine() -> FraudEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = FraudEngine()
    return _engine_instance


def engine_name() -> str:
    return "Member 1 Fraud Engine (VEL001, AMT001, GEO001)"


def transaction_to_engine_model(tx_data: Any) -> EngineTransaction:
    """
    Adapter converting SQLAlchemy Transaction, dict, or Pydantic model
    into Member 1's internal EngineTransaction dataclass.
    """
    if isinstance(tx_data, EngineTransaction):
        return tx_data

    if isinstance(tx_data, dict):
        tx_id = str(tx_data.get("id") or "")
        customer_id = str(tx_data.get("customer_id") or tx_data.get("account_id") or "")
        amount = float(tx_data.get("amount", 0.0))
        currency = str(tx_data.get("currency") or "INR")

        raw_ts = tx_data.get("timestamp")
        if isinstance(raw_ts, str):
            ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
        elif isinstance(raw_ts, datetime):
            ts = raw_ts
        else:
            ts = datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        else:
            ts = ts.astimezone(timezone.utc)

        lat = float(tx_data.get("latitude") or 0.0) if tx_data.get("latitude") is not None else 0.0
        lon = float(tx_data.get("longitude") or 0.0) if tx_data.get("longitude") is not None else 0.0
        city = tx_data.get("city")
        country = tx_data.get("country")
        location_name = f"{city}, {country}" if (city and country) else (city or country or "")
        merchant = str(tx_data.get("merchant") or "")
        device_id = str(tx_data.get("device_id") or "")
        ip_address = str(tx_data.get("ip_address") or "")

        return EngineTransaction(
            id=tx_id,
            account_id=customer_id,
            amount=amount,
            currency=currency,
            timestamp=ts,
            latitude=lat,
            longitude=lon,
            location_name=location_name,
            merchant=merchant,
            device_id=device_id,
            ip_address=ip_address,
        )

    # SQLAlchemy Transaction or object with attributes
    raw_ts = getattr(tx_data, "timestamp", None)
    if isinstance(raw_ts, datetime):
        ts = raw_ts.replace(tzinfo=timezone.utc) if raw_ts.tzinfo is None else raw_ts.astimezone(timezone.utc)
    else:
        ts = datetime.now(timezone.utc)

    lat = float(tx_data.latitude) if getattr(tx_data, "latitude", None) is not None else 0.0
    lon = float(tx_data.longitude) if getattr(tx_data, "longitude", None) is not None else 0.0
    city = getattr(tx_data, "city", None)
    country = getattr(tx_data, "country", None)
    location_name = f"{city}, {country}" if (city and country) else (city or country or "")

    return EngineTransaction(
        id=str(getattr(tx_data, "id", "") or ""),
        account_id=str(getattr(tx_data, "customer_id", getattr(tx_data, "account_id", ""))),
        amount=float(getattr(tx_data, "amount", 0.0)),
        currency=str(getattr(tx_data, "currency", "INR") or "INR"),
        timestamp=ts,
        latitude=lat,
        longitude=lon,
        location_name=location_name,
        merchant=str(getattr(tx_data, "merchant", "") or ""),
        device_id=str(getattr(tx_data, "device_id", "") or ""),
        ip_address=str(getattr(tx_data, "ip_address", "") or ""),
    )


def evaluate(transaction: Union[dict, Any], history: List[Any], rules: List[dict]) -> dict:
    """
    Main evaluation pipeline called by backend services.
    Evaluates Member 1's FraudEngine with active PostgreSQL rules configuration.
    """
    engine = get_engine()
    engine_tx = transaction_to_engine_model(transaction)

    # 1. Prepare engine rule configurations from PostgreSQL active rules
    rules_config: Dict[str, Dict[str, Any]] = {
        "active_rules": [],
    }

    for r in rules:
        rule_id = r["rule_id"]
        cfg = dict(r.get("config") or {})
        score = int(r.get("score", 0))
        cfg["weight"] = score
        cfg["score"] = score
        cfg["enabled"] = bool(r.get("enabled", True))

        # Dynamically register custom condition rules in engine registry if missing
        if r.get("rule_type") == "CONDITION" or rule_id not in engine.registry._rules:
            if rule_id not in engine.registry._rules:
                engine.registry.register(DynamicConditionRule(rule_id, r.get("name", rule_id)))

        # Canonical parameter aliases for built-ins
        if rule_id == "VEL001":
            if "max_transactions" in cfg and "threshold" not in cfg:
                cfg["threshold"] = cfg["max_transactions"]
        elif rule_id == "AMT001":
            if "multiplier" in cfg and "mode" not in cfg:
                cfg["mode"] = "relative"
        elif rule_id == "GEO001":
            if "max_speed_kmh" in cfg and "speed_limit_kmh" not in cfg:
                cfg["speed_limit_kmh"] = cfg["max_speed_kmh"]

        if cfg["enabled"]:
            rules_config["active_rules"].append(rule_id)
        rules_config[rule_id] = cfg

    # 2. Prepare Context (History, Previous Transaction, Historical Average)
    engine_history = [transaction_to_engine_model(h) for h in history]
    engine_history.sort(key=lambda x: x.timestamp)

    prior_txs = [
        h for h in engine_history
        if (h.id != engine_tx.id or not engine_tx.id) and h.timestamp <= engine_tx.timestamp
    ]

    prev_tx = prior_txs[-1] if prior_txs else None

    prior_amounts = [h.amount for h in prior_txs]
    hist_avg = sum(prior_amounts) / len(prior_amounts) if prior_amounts else 0.0

    context = {
        "history": engine_history,
        "previous_transaction": prev_tx,
        "historical_average": hist_avg,
    }

    # 3. Evaluate using Member 1 FraudEngine
    decision: FraudDecision = engine.evaluate(engine_tx, rules_config, context)

    # 4. Normalize response for Member 2 database persistence & APIs
    level_str = (
        decision.risk_level.value
        if hasattr(decision.risk_level, "value")
        else str(decision.risk_level)
    )

    results = [
        {
            "rule_id": r.rule_id,
            "rule_name": r.rule_name,
            "triggered": bool(r.triggered),
            "score": int(r.score),
            "evidence": str(r.evidence or ""),
        }
        for r in decision.rule_results
    ]

    return {
        "risk_score": decision.risk_score,
        "risk_level": level_str,
        "decision": decision.decision,
        "rule_results": results,
    }
