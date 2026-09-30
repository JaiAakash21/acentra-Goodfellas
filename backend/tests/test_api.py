from datetime import datetime, timedelta, timezone


def iso(minutes_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat()


def post_tx(client, **kw):
    body = {"customer_id": "C1", "amount": 1000, "city": "Chennai",
            "latitude": 13.0827, "longitude": 80.2707, "timestamp": iso(0)}
    body.update(kw)
    r = client.post("/api/transactions", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_health(client):
    r = client.get("/api/health").json()
    assert r["status"] == "ok" and r["database"] == "connected"


def test_default_rules_exist(client):
    ids = {r["rule_id"] for r in client.get("/api/rules").json()}
    assert {"VEL001", "AMT001", "GEO001", "NIGHT001"} <= ids


def test_normal_transaction_not_flagged(client):
    tx = post_tx(client)
    assert tx["risk_level"] == "LOW" and tx["is_flagged"] is False and tx["flag_id"] is None


def test_all_three_rules_critical(client):
    r = client.post("/api/demo/scenario/combined")
    assert r.status_code == 200
    london = [t for t in r.json() if t["city"] == "London"][0]
    detail = client.get(f"/api/transactions/{london['id']}").json()
    triggered = {x["rule_id"] for x in detail["rule_results"] if x["triggered"]}
    assert triggered == {"VEL001", "AMT001", "GEO001"}
    assert detail["risk_score"] == 85 and detail["risk_level"] == "CRITICAL"
    assert detail["review_status"] == "PENDING"
    assert any(a["action"] == "NOTIFICATION_LOGGED" for a in detail["audit_trail"])


def test_each_single_rule_scenario(client):
    for name, rule in [("velocity", "VEL001"), ("amount", "AMT001"), ("geography", "GEO001")]:
        txs = client.post(f"/api/demo/scenario/{name}").json()
        flagged = [t for t in txs if t["is_flagged"]]
        assert flagged, name
        detail = client.get(f"/api/transactions/{flagged[-1]['id']}").json()
        assert rule in {x["rule_id"] for x in detail["rule_results"] if x["triggered"]}


def test_review_and_clear_flow(client):
    client.post("/api/demo/scenario/amount")
    pending = client.get("/api/reviews/pending").json()
    assert len(pending) == 1
    case_id = pending[0]["flag_id"]
    assert pending[0]["triggered_rules"][0]["evidence"]

    r = client.post(f"/api/reviews/{case_id}/review", json={"reviewer": "akash", "comment": "checking"})
    assert r.json()["status"] == "REVIEWED"
    assert client.get("/api/reviews/pending").json() == []
    assert client.post(f"/api/reviews/{case_id}/review").status_code == 409  # cannot review twice

    r = client.post(f"/api/reviews/{case_id}/clear")  # body optional
    assert r.json()["status"] == "CLEARED"
    assert client.post(f"/api/reviews/{case_id}/clear").status_code == 409
    assert client.post("/api/reviews/9999/clear").status_code == 404


def test_dashboard_stats(client):
    assert client.post("/api/demo/seed").json()["seeded"] is True
    s = client.get("/api/dashboard/stats").json()
    assert s["total_transactions"] > 100
    assert s["flagged_transactions"] >= s["pending_reviews"] > 0
    assert s["critical"] >= 2 and s["high_risk"] >= 0
    assert client.post("/api/demo/seed").json()["seeded"] is False  # not seeded twice


def test_new_rule_without_touching_engine_and_simulate(client):
    client.post("/api/demo/seed")
    before = client.get("/api/dashboard/stats").json()["flagged_transactions"]

    sim = client.post("/api/rules/NIGHT001/simulate").json()
    assert sim["rule_triggered_count"] == 1
    assert sim["newly_flagged"] == 1
    assert sim["after"]["flagged"] == sim["before"]["flagged"] + 1

    # Simulation writes nothing
    assert client.get("/api/dashboard/stats").json()["flagged_transactions"] == before

    # Brand-new rule created through the API only
    new_rule = {
        "rule_id": "HIGHVAL001", "name": "Very high value", "rule_type": "CONDITION", "score": 40,
        "config": {"conditions": [{"field": "amount", "op": ">", "value": 60000}]},
    }
    assert client.post("/api/rules", json=new_rule).status_code == 201
    assert client.post("/api/rules", json=new_rule).status_code == 409
    tx = post_tx(client, customer_id="NEWCUST", amount=70000)
    detail = client.get(f"/api/transactions/{tx['id']}").json()
    assert any(r["rule_id"] == "HIGHVAL001" and r["triggered"] for r in detail["rule_results"])

    # Disable it -> no longer evaluated
    assert client.put("/api/rules/HIGHVAL001", json={"enabled": False}).json()["enabled"] is False
    tx2 = post_tx(client, customer_id="NEWCUST2", amount=70000)
    detail2 = client.get(f"/api/transactions/{tx2['id']}").json()
    assert all(r["rule_id"] != "HIGHVAL001" for r in detail2["rule_results"])


def test_draft_simulation_and_validation(client):
    client.post("/api/demo/seed")
    draft = {"rule": {"rule_id": "DRAFT001", "name": "Draft", "rule_type": "CONDITION", "score": 30,
                      "config": {"conditions": [{"field": "amount", "op": ">", "value": 50000}]}}}
    assert client.post("/api/rules/simulate", json=draft).status_code == 200
    bad = {"rule_id": "BAD001", "name": "x", "rule_type": "CONDITION", "config": {}}
    assert client.post("/api/rules", json=bad).status_code == 422


def test_filters_and_validation(client):
    client.post("/api/demo/seed")
    crit = client.get("/api/transactions", params={"risk_level": "CRITICAL"}).json()
    assert crit["total"] >= 2 and all(t["risk_level"] == "CRITICAL" for t in crit["items"])
    found = client.get("/api/transactions", params={"search": "london"}).json()
    assert found["total"] >= 1
    assert client.get("/api/transactions/99999").status_code == 404
    assert client.post("/api/transactions", json={"customer_id": "x", "amount": -5}).status_code == 422
    assert client.post("/api/transactions", json={"customer_id": "x", "amount": 5, "latitude": 12}).status_code == 422


def test_deterministic_judge_scenarios(client):
    # 1. Normal scenario
    txs_normal = client.post("/api/demo/scenario/DEMO-NORMAL-001").json()
    last_normal = txs_normal[-1]
    assert last_normal["risk_level"] == "LOW"
    assert last_normal["is_flagged"] is False

    # 2. Velocity scenario
    txs_velocity = client.post("/api/demo/scenario/DEMO-VELOCITY-001").json()
    last_velocity = txs_velocity[-1]
    detail_vel = client.get(f"/api/transactions/{last_velocity['id']}").json()
    assert any(r["rule_id"] == "VEL001" and r["triggered"] for r in detail_vel["rule_results"])
    assert detail_vel["risk_score"] == 30
    assert detail_vel["risk_level"] == "MEDIUM"

    # 3. Amount scenario
    txs_amount = client.post("/api/demo/scenario/DEMO-AMOUNT-001").json()
    last_amount = txs_amount[-1]
    detail_amt = client.get(f"/api/transactions/{last_amount['id']}").json()
    assert any(r["rule_id"] == "AMT001" and r["triggered"] for r in detail_amt["rule_results"])
    assert detail_amt["risk_score"] == 25
    assert detail_amt["risk_level"] == "MEDIUM"

    # 4. Geography scenario
    txs_geo = client.post("/api/demo/scenario/DEMO-GEO-001").json()
    last_geo = txs_geo[-1]
    detail_geo = client.get(f"/api/transactions/{last_geo['id']}").json()
    assert any(r["rule_id"] == "GEO001" and r["triggered"] for r in detail_geo["rule_results"])
    assert detail_geo["risk_score"] == 30
    assert detail_geo["risk_level"] == "MEDIUM"

    # 5. Combined Critical case: Velocity (30) + Amount (25) + Geography (30) = 85 CRITICAL
    txs_crit = client.post("/api/demo/scenario/DEMO-CRITICAL-001").json()
    last_crit = [t for t in txs_crit if t["city"] == "London"][0]
    detail_crit = client.get(f"/api/transactions/{last_crit['id']}").json()
    triggered = {x["rule_id"] for x in detail_crit["rule_results"] if x["triggered"]}
    assert triggered == {"VEL001", "AMT001", "GEO001"}
    assert detail_crit["risk_score"] == 85
    assert detail_crit["risk_level"] == "CRITICAL"
    assert detail_crit["review_status"] == "PENDING"
    assert len(detail_crit["rule_results"]) >= 3
    assert detail_crit["flag_id"] is not None
    assert any(a["action"] == "FLAG_CREATED" for a in detail_crit["audit_trail"])
    assert any(a["action"] == "NOTIFICATION_LOGGED" for a in detail_crit["audit_trail"])

