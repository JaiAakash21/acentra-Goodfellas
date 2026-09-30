# FraudLens - Fraud Detection Engine

Welcome to the FraudLens repository. This repository contains the **Member 1 Core Fraud Engine** implementation for the FraudLens explainable fraud-risk decision platform.

## Overview
FraudLens is designed to evaluate financial transactions against independent fraud rules (Velocity, Amount, Geography) and produce an aggregated risk score and decision. The core engine is mathematically pure, deterministic, and highly extensible.

### Folder Structure
```text
backend/
└── app/
    ├── engine/         # Core evaluation, aggregation, and registry logic
    └── rules/          # Concrete implementation of fraud rules
tests/
└── engine/             # Unit and integration tests for the engine
scratch_sim.py          # Member 2 integration simulation & test script
```

## Features Complete (Member 1)
- **Transaction Velocity Rule**: Detects abnormal transaction frequencies.
- **Unusual Amount Rule**: Detects threshold breaches (absolute or relative to history).
- **Impossible Geography Rule**: Detects geographical travel anomalies using Haversine formulas.
- **Generic Evaluator & Risk Aggregator**: Dynamically processes active rules to compute risk scores (0-100) and operational decisions (APPROVE, MONITOR, REVIEW, PRIORITY_REVIEW).
- **Extensible Registry**: Allows injecting brand-new rules dynamically without modifying the engine.

## Testing the Engine
The engine requires zero external dependencies (no databases, no web frameworks). It runs entirely on the standard Python library.

Run the test suite:
```powershell
# Set the python path to the project root and discover tests
$env:PYTHONPATH="."; python -m unittest discover -s tests
```

Run the end-to-end integration simulation:
```powershell
python scratch_sim.py
```

## Integration Guide (Member 2)
If you are integrating this engine into your FastAPI/Database backend, please read the detailed integration guide here:
[Member 1 Integration Guide](backend/app/engine/README.md)
