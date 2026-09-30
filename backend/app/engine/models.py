from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class RiskLevel(str, Enum):
    """
    Risk levels to classify the transaction's overall risk.
    Using str Enum allows easy serialization for Member 2.
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class Transaction:
    """
    Internal representation of a financial transaction.
    Contains the required fields for the three mandatory fraud rules.
    """
    id: str
    account_id: str
    amount: float
    currency: str
    timestamp: datetime
    latitude: float
    longitude: float
    location_name: str
    merchant: str
    device_id: str
    ip_address: str


@dataclass
class RuleResult:
    """
    The output of a single fraud rule evaluation.
    Maps conceptually to the shared RuleResult contract.
    """
    rule_id: str
    rule_name: str
    triggered: bool
    score: int
    evidence: str
    transaction_id: str


@dataclass
class FraudDecision:
    """
    The final output of the Member 1 Fraud Engine.
    Contains the aggregated risk and individual rule results.
    Member 2 uses this to create the FraudFlag and persist results.
    """
    transaction_id: str
    risk_score: int
    risk_level: RiskLevel
    decision: str
    rule_results: List[RuleResult] = field(default_factory=list)
