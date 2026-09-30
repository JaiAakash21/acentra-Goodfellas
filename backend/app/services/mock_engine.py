"""
Built-in FALLBACK fraud engine.

It follows the exact contract Member 1's real engine must follow, so the backend
works before Member 1 is finished. When `fraud_engine/` exists at the repo root
and exports `evaluate`, fraud_service.py uses that instead and this file is unused.

CONTRACT
    evaluate(transaction: dict, history: list[dict], rules: list[dict]) -> dict

    transaction / history items: {customer_id, amount, currency, merchant, category,
                                  city, country, latitude, longitude, timestamp (ISO-8601 str)}
    rules items:  {rule_id, name, rule_type, config, score, enabled}
    returns:      {risk_score: int 0-100, risk_level: LOW|MEDIUM|HIGH|CRITICAL,
                   rule_results: [{rule_id, triggered, score, evidence}, ...]}
"""
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt

# Night-time rules use India Standard Time (UTC+5:30) for the "hour" field.
LOCAL_UTC_OFFSET_MINUTES = 330


def score_to_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 25:
        return "MEDIUM"
    return "LOW"


def _ts(value) -> datetime:
    dt = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    a = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(a))


# ------------------------------------------------------------------ evaluators
def _velocity(tx, history, rule):
    cfg = rule.get("config") or {}
    window = float(cfg.get("window_minutes", 10))
    limit = int(cfg.get("max_transactions", 5))
    now = _ts(tx["timestamp"])
    start = now - timedelta(minutes=window)
    count = 1 + sum(1 for h in history if start <= _ts(h["timestamp"]) <= now)
    if count > limit:
        return True, f"{count} transactions within {window:g} minutes"
    return False, f"{count} transactions in the last {window:g} minutes (limit {limit})"


def _amount(tx, history, rule):
    cfg = rule.get("config") or {}
    multiplier = float(cfg.get("multiplier", 5))
    min_history = int(cfg.get("min_history", 3))
    amounts = [float(h["amount"]) for h in history]
    if len(amounts) < min_history:
        return False, f"Only {len(amounts)} previous transactions (need {min_history}) to compute an average"
    avg = sum(amounts) / len(amounts)
    if avg <= 0:
        return False, "Historical average is zero"
    ratio = float(tx["amount"]) / avg
    if ratio >= multiplier:
        return True, f"Amount is {ratio:.2f}x historical average ({avg:,.2f})"
    return False, f"Amount is {ratio:.2f}x historical average (threshold {multiplier:g}x)"


def _geography(tx, history, rule):
    cfg = rule.get("config") or {}
    max_speed = float(cfg.get("max_speed_kmh", 900))
    min_distance = float(cfg.get("min_distance_km", 100))
    if tx.get("latitude") is None or tx.get("longitude") is None:
        return False, "No location data on this transaction"
    now = _ts(tx["timestamp"])
    located = [h for h in history if h.get("latitude") is not None and _ts(h["timestamp"]) <= now]
    if not located:
        return False, "No previous located transaction to compare with"
    prev = max(located, key=lambda h: _ts(h["timestamp"]))
    dist = _haversine_km(prev["latitude"], prev["longitude"], tx["latitude"], tx["longitude"])
    elapsed_s = max((now - _ts(prev["timestamp"])).total_seconds(), 60)  # floor at 1 minute
    speed = dist / (elapsed_s / 3600)
    if dist >= min_distance and speed > max_speed:
        a = prev.get("city") or "previous location"
        b = tx.get("city") or "current location"
        return True, (
            f"{a} -> {b}: {dist:,.0f} km in {elapsed_s / 60:.0f} min "
            f"requires {speed:,.0f} km/h (limit {max_speed:g} km/h)"
        )
    return False, f"Travel of {dist:,.0f} km needs {speed:,.0f} km/h (limit {max_speed:g} km/h)"


def _field(tx, field):
    if field in ("hour", "day_of_week"):
        local = _ts(tx["timestamp"]) + timedelta(minutes=LOCAL_UTC_OFFSET_MINUTES)
        return local.hour if field == "hour" else local.weekday()  # Monday = 0
    return tx.get(field)


def _compare(actual, op, expected) -> bool:
    if actual is None:
        return False
    if isinstance(actual, str):
        actual = actual.lower()
        expected = [str(e).lower() for e in expected] if isinstance(expected, list) else str(expected).lower()
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
        return (lo <= actual <= hi) if lo <= hi else (actual >= lo or actual <= hi)  # supports 22..3 wrap
    raise ValueError(f"unsupported operator {op!r}")


def _condition(tx, history, rule):
    cfg = rule.get("config") or {}
    match_all = cfg.get("match", "all") == "all"
    parts, hits = [], []
    for c in cfg.get("conditions", []):
        actual = _field(tx, c["field"])
        ok = _compare(actual, c["op"], c["value"])
        hits.append(ok)
        parts.append(f"{c['field']} {c['op']} {c['value']} (actual {actual})")
    triggered = bool(hits) and (all(hits) if match_all else any(hits))
    label = "Matched all" if match_all else "Matched any"
    return triggered, (f"{label}: " if triggered else "Not matched: ") + "; ".join(parts)


_EVALUATORS = {
    "VELOCITY": _velocity,
    "AMOUNT": _amount,
    "GEOGRAPHY": _geography,
    "CONDITION": _condition,
}


def evaluate(transaction: dict, history: list, rules: list) -> dict:
    results = []
    for rule in rules:
        if not rule.get("enabled", True):
            continue
        fn = _EVALUATORS.get(rule["rule_type"])
        try:
            if fn is None:
                triggered, evidence = False, f"Unsupported rule type {rule['rule_type']}"
            else:
                triggered, evidence = fn(transaction, history, rule)
        except Exception as exc:  # one broken rule must never break the others
            triggered, evidence = False, f"Rule error: {exc}"
        results.append(
            {
                "rule_id": rule["rule_id"],
                "triggered": triggered,
                "score": int(rule.get("score", 0)) if triggered else 0,
                "evidence": evidence,
            }
        )
    total = min(100, sum(r["score"] for r in results))
    return {"risk_score": total, "risk_level": score_to_level(total), "rule_results": results}
