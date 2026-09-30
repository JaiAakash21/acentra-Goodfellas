import math
from typing import Any, Dict

from backend.app.engine.models import Transaction, RuleResult
from backend.app.rules.base import BaseRule


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points on the earth."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class ImpossibleGeographyRule(BaseRule):
    @property
    def rule_id(self) -> str:
        return "GEO_001"

    @property
    def rule_name(self) -> str:
        return "Impossible Geographical Location"

    def evaluate(self, transaction: Transaction, context: Dict[str, Any], config: Dict[str, Any]) -> RuleResult:
        weight = config.get("weight", 30)
        speed_limit_kmh = config.get("speed_limit_kmh", 900)

        previous_transaction = context.get("previous_transaction")
        if not previous_transaction:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence="No previous transaction found in context to compare geographical distance.",
                transaction_id=transaction.id
            )

        try:
            curr_lat, curr_lon = float(transaction.latitude), float(transaction.longitude)
            prev_lat, prev_lon = float(previous_transaction.latitude), float(previous_transaction.longitude)
        except (TypeError, ValueError):
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence="Missing or invalid latitude/longitude coordinates.",
                transaction_id=transaction.id
            )
            
        elapsed_time = transaction.timestamp - previous_transaction.timestamp
        elapsed_hours = elapsed_time.total_seconds() / 3600.0

        if elapsed_hours <= 0:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence="Elapsed time is zero or negative. Cannot compute travel speed.",
                transaction_id=transaction.id
            )

        distance_km = haversine(prev_lat, prev_lon, curr_lat, curr_lon)
        
        if distance_km < 1.0:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence="Location is effectively unchanged.",
                transaction_id=transaction.id
            )

        estimated_speed = distance_km / elapsed_hours

        triggered = estimated_speed > speed_limit_kmh
        score = weight if triggered else 0
        
        if triggered:
            evidence = (f"Previous transaction was {round(distance_km, 2)} km away "
                        f"{round(elapsed_hours * 60)} minutes earlier; "
                        f"estimated travel speed of {round(estimated_speed)} km/h exceeds the configured limit of {speed_limit_kmh} km/h.")
        else:
            evidence = (f"Travel speed is {round(estimated_speed)} km/h, which is within "
                        f"the limit of {speed_limit_kmh} km/h.")

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            score=score,
            evidence=evidence,
            transaction_id=transaction.id
        )
