"""Pydantic schemas = the API contract shared with Member 3 (React) and Member 4 (Rule Studio)."""
from datetime import datetime, timezone
from typing import Annotated, Any, Literal, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

RuleType = Literal["VELOCITY", "AMOUNT", "GEOGRAPHY", "CONDITION"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def _as_utc(dt: datetime) -> datetime:
    """SQLite drops timezones; make every output timestamp explicit UTC (…+00:00)."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


UTCDateTime = Annotated[datetime, AfterValidator(_as_utc)]


# ---------------------------------------------------------------- transactions
class TransactionCreate(BaseModel):
    customer_id: str = Field(min_length=1, max_length=64)
    amount: float = Field(gt=0)
    currency: str = "INR"
    merchant: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    timestamp: Optional[datetime] = None  # defaults to "now" (UTC)

    @model_validator(mode="after")
    def _both_coordinates(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "customer_id": "CUST-1001",
                "amount": 14600,
                "currency": "INR",
                "merchant": "Harrods",
                "category": "retail",
                "city": "London",
                "country": "UK",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "timestamp": "2026-09-30T10:30:00Z",
            }
        }
    )


class RuleResultOut(BaseModel):
    rule_id: str
    rule_name: Optional[str] = None
    triggered: bool
    score: int
    evidence: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ReviewOut(BaseModel):
    id: int
    reviewer: str
    action: str
    comment: Optional[str] = None
    created_at: UTCDateTime
    model_config = ConfigDict(from_attributes=True)


class AuditLogOut(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    action: str
    actor: str
    details: Optional[dict[str, Any]] = None
    created_at: UTCDateTime
    model_config = ConfigDict(from_attributes=True)


class TransactionOut(BaseModel):
    id: int
    customer_id: str
    amount: float
    currency: str
    merchant: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: UTCDateTime
    risk_score: int
    risk_level: str
    is_flagged: bool
    flag_id: Optional[int] = None          # the review "case id" (None if not flagged)
    review_status: Optional[str] = None    # PENDING | REVIEWED | CLEARED | None
    created_at: UTCDateTime
    model_config = ConfigDict(from_attributes=True)


class TransactionDetail(TransactionOut):
    rule_results: list[RuleResultOut] = []
    reviews: list[ReviewOut] = []
    audit_trail: list[AuditLogOut] = []


class TransactionPage(BaseModel):
    total: int
    items: list[TransactionOut]


# --------------------------------------------------------------------- reviews
class ReviewAction(BaseModel):
    reviewer: str = "reviewer"
    comment: Optional[str] = None


class ReviewCaseOut(BaseModel):
    flag_id: int
    status: str
    risk_score: int
    risk_level: str
    created_at: UTCDateTime
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[UTCDateTime] = None
    transaction: TransactionOut
    triggered_rules: list[RuleResultOut]
    reviews: list[ReviewOut] = []


# ----------------------------------------------------------------------- rules
def _validate_config(rule_type: str, config: dict) -> None:
    if rule_type == "CONDITION":
        conds = config.get("conditions")
        if not isinstance(conds, list) or not conds:
            raise ValueError("CONDITION rules need config.conditions = [{field, op, value}, ...]")
        for c in conds:
            if not isinstance(c, dict) or not {"field", "op", "value"} <= set(c):
                raise ValueError("each condition needs field, op and value")
        if config.get("match", "all") not in ("all", "any"):
            raise ValueError("config.match must be 'all' or 'any'")


class RuleCreate(BaseModel):
    rule_id: str = Field(pattern=r"^[A-Z0-9_]{3,32}$", description="Unique code, e.g. NIGHT001")
    name: str = Field(min_length=1, max_length=128)
    description: Optional[str] = None
    rule_type: RuleType = "CONDITION"
    config: dict[str, Any] = {}
    score: int = Field(default=10, ge=0, le=100)
    enabled: bool = True

    @model_validator(mode="after")
    def _check_config(self):
        _validate_config(self.rule_type, self.config)
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rule_id": "NIGHT001",
                "name": "Night-time High Value Transfer",
                "description": "Amount > 50,000 between 00:00 and 03:59 (IST)",
                "rule_type": "CONDITION",
                "config": {
                    "match": "all",
                    "conditions": [
                        {"field": "amount", "op": ">", "value": 50000},
                        {"field": "hour", "op": "between", "value": [0, 3]},
                    ],
                },
                "score": 30,
                "enabled": True,
            }
        }
    )


class RuleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    description: Optional[str] = None
    config: Optional[dict[str, Any]] = None
    score: Optional[int] = Field(default=None, ge=0, le=100)
    enabled: Optional[bool] = None


class RuleOut(BaseModel):
    id: int
    rule_id: str
    name: str
    description: Optional[str] = None
    rule_type: str
    config: dict[str, Any]
    score: int
    enabled: bool
    is_builtin: bool
    created_at: UTCDateTime
    updated_at: UTCDateTime
    model_config = ConfigDict(from_attributes=True)


class SimulationRequest(BaseModel):
    """Optional 'what-if' changes for an existing rule."""
    config: Optional[dict[str, Any]] = None
    score: Optional[int] = Field(default=None, ge=0, le=100)
    limit: int = Field(default=500, ge=1, le=5000, description="How many recent transactions to replay")


class DraftSimulationRequest(BaseModel):
    rule: RuleCreate
    limit: int = Field(default=500, ge=1, le=5000)


class LevelCounts(BaseModel):
    flagged: int
    medium: int
    high: int
    critical: int


class AffectedTransaction(BaseModel):
    transaction_id: int
    customer_id: str
    amount: float
    timestamp: str
    before_score: int
    before_level: str
    after_score: int
    after_level: str
    rule_triggered: bool
    evidence: Optional[str] = None


class SimulationResult(BaseModel):
    rule_id: str
    transactions_evaluated: int
    rule_triggered_count: int
    before: LevelCounts
    after: LevelCounts
    newly_flagged: int
    no_longer_flagged: int
    score_changed: int
    affected_transactions: list[AffectedTransaction]


# ------------------------------------------------------------------- dashboard
class DashboardStats(BaseModel):
    total_transactions: int
    flagged_transactions: int
    high_risk: int
    critical: int
    pending_reviews: int
    medium_risk: int = 0
    reviewed: int = 0
    cleared: int = 0
    active_rules: int = 0
    risk_distribution: dict[str, int] = {}
