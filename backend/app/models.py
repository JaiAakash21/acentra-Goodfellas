"""Database tables: transactions, rules, fraud_flags, rule_results, reviews, audit_log."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(64), index=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    merchant: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    # Result of the fraud engine (denormalised for fast dashboards/filters)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(16), default="LOW", index=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    rule_results: Mapped[list["RuleResult"]] = relationship(
        back_populates="transaction", cascade="all, delete-orphan", order_by="RuleResult.id"
    )
    flag: Mapped[Optional["FraudFlag"]] = relationship(
        back_populates="transaction", uselist=False, cascade="all, delete-orphan"
    )

    # Convenience properties used by the response schemas
    @property
    def flag_id(self) -> Optional[int]:
        return self.flag.id if self.flag else None

    @property
    def review_status(self) -> Optional[str]:
        return self.flag.status if self.flag else None

    @property
    def reviews(self) -> list["Review"]:
        return list(self.flag.reviews) if self.flag else []


class Rule(Base):
    __tablename__ = "rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    rule_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # e.g. VEL001
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rule_type: Mapped[str] = mapped_column(String(32))  # VELOCITY | AMOUNT | GEOGRAPHY | CONDITION
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    score: Mapped[int] = mapped_column(Integer, default=10)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class RuleResult(Base):
    __tablename__ = "rule_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int] = mapped_column(ForeignKey("transactions.id"), index=True)
    rule_id: Mapped[str] = mapped_column(String(32), index=True)
    rule_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[int] = mapped_column(Integer, default=0)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    transaction: Mapped[Transaction] = relationship(back_populates="rule_results")


class FraudFlag(Base):
    """A suspicious transaction that needs a human reviewer. Its id is the 'case id'."""

    __tablename__ = "fraud_flags"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int] = mapped_column(ForeignKey("transactions.id"), unique=True, index=True)
    risk_score: Mapped[int] = mapped_column(Integer)
    risk_level: Mapped[str] = mapped_column(String(16), index=True)
    status: Mapped[str] = mapped_column(String(16), default="PENDING", index=True)  # PENDING|REVIEWED|CLEARED
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    transaction: Mapped[Transaction] = relationship(back_populates="flag")
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="flag", cascade="all, delete-orphan", order_by="Review.id"
    )


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    fraud_flag_id: Mapped[int] = mapped_column(ForeignKey("fraud_flags.id"), index=True)
    reviewer: Mapped[str] = mapped_column(String(64), default="reviewer")
    action: Mapped[str] = mapped_column(String(16))  # REVIEWED | CLEARED
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    flag: Mapped[FraudFlag] = relationship(back_populates="reviews")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(32), index=True)  # TRANSACTION | FLAG | RULE | ...
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    action: Mapped[str] = mapped_column(String(48))
    actor: Mapped[str] = mapped_column(String(64), default="system")
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
