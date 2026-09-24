"""Recommendation Service — ranks a small candidate pool into 2-3 tagged,
reasoned picks. Ranking/reasons are computed deterministically (accuracy);
only the free-text comparison summary is LLM-generated.
"""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.buyer_discovery.service import DiscoveryService
from app.modules.recommendation.schemas import CompareRequest
from app.core.ai import chat
from app.core.exceptions import ValidationException


def _reasons_best_fit(c: dict, budget: Optional[float]) -> list[str]:
    reasons = []
    if budget:
        reasons.append("Within your budget")
    if c.get("trust_score") and c["trust_score"] >= 70:
        reasons.append(f"Reliable seller (trust score {round(c['trust_score'])})")
    reasons.append("In stock and ready to ship")
    return reasons


def _reasons_value(c: dict, budget: Optional[float]) -> list[str]:
    reasons = ["Lower price than similar options"]
    if budget:
        reasons.append("Within your budget")
    reasons.append("In stock and ready to ship")
    return reasons


def _reasons_delivery(c: dict) -> list[str]:
    reasons = []
    if c.get("seller_verification_status") == "verified":
        reasons.append("From a verified seller — faster order confirmation")
    reasons.append("In stock and ready to ship")
    return reasons


def _to_item(c: dict, tag: str, reasons: list[str]) -> dict:
    return {
        "product_id": c["id"],
        "name": c["name"],
        "price": c["price"],
        "image_url": c.get("image_url"),
        "category": c["category"],
        "stock": c["stock"],
        "seller_id": c["seller_id"],
        "seller_name": c.get("seller_name"),
        "trust_score": c.get("trust_score"),
        "tag": tag,
        "reasons": reasons,
    }


class RecommendationService:
    """Business logic for recommendations and comparisons."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.discovery = DiscoveryService(db)

    async def recommend(
        self,
        category: Optional[str] = None,
        budget: Optional[float] = None,
        q: Optional[str] = None,
        location: Optional[str] = None,
    ) -> list[dict]:
        """2-3 relevant, reasoned picks — never a full list (PRD §9)."""
        result = await self.discovery.search_products(
            category=category, location=location, budget=budget, q=q, limit=20, offset=0,
        )
        candidates = [c for c in result["items"] if c["stock"] > 0]
        if not candidates:
            return []

        picks: list[tuple[dict, str, list[str]]] = []
        used_ids: set[int] = set()

        def score_best_fit(c: dict) -> float:
            trust = c.get("trust_score") or 50
            in_budget = budget is None or c["price"] <= budget
            return trust + (20 if in_budget else -50)

        best_fit = max(candidates, key=score_best_fit)
        picks.append((best_fit, "Best Fit", _reasons_best_fit(best_fit, budget)))
        used_ids.add(best_fit["id"])

        remaining = [c for c in candidates if c["id"] not in used_ids]
        if remaining:
            better_value = min(remaining, key=lambda c: c["price"])
            picks.append((better_value, "Better Value", _reasons_value(better_value, budget)))
            used_ids.add(better_value["id"])

        remaining = [c for c in candidates if c["id"] not in used_ids]
        if remaining:
            faster = next(
                (c for c in remaining if c.get("seller_verification_status") == "verified"),
                remaining[0],
            )
            picks.append((faster, "Faster Delivery", _reasons_delivery(faster)))
            used_ids.add(faster["id"])

        return [_to_item(c, tag, reasons) for c, tag, reasons in picks[:3]]

    async def compare(self, data: CompareRequest) -> dict:
        result = await self.discovery.search_products(limit=100, offset=0)
        by_id = {c["id"]: c for c in result["items"]}
        # Candidate pool from search may not include every requested id (e.g.
        # if it's outside the default page) — fetch directly as a fallback.
        missing = [pid for pid in data.product_ids if pid not in by_id]
        if missing:
            from sqlalchemy import select
            from app.modules.seller_profile.models import Product, SellerProfile
            from app.modules.analytics.models import TrustScore
            rows = await self.db.execute(
                select(Product, SellerProfile.business_name, TrustScore.overall_score)
                .join(SellerProfile, Product.seller_id == SellerProfile.id)
                .outerjoin(TrustScore, TrustScore.seller_id == SellerProfile.id)
                .where(Product.id.in_(missing))
            )
            for product, seller_name, trust_score in rows.all():
                by_id[product.id] = {
                    "id": product.id, "name": product.name, "price": product.price,
                    "stock": product.stock, "seller_name": seller_name,
                    "trust_score": round(trust_score, 1) if trust_score is not None else None,
                }

        products = [by_id[pid] for pid in data.product_ids if pid in by_id]
        if len(products) < 2:
            raise ValidationException("Could not find enough of the selected products to compare")

        table = [
            {
                "product_id": p["id"], "name": p["name"], "price": p["price"],
                "trust_score": p.get("trust_score"), "stock": p["stock"],
            }
            for p in products
        ]

        lines = "\n".join(
            f"- {p['name']}: ${p['price']}, trust score {p.get('trust_score') or 'n/a'}, {p['stock']} in stock"
            for p in products
        )
        summary = await chat(
            "You compare products for a shopper in 1-3 short sentences. Be concrete "
            "(mention price and trust differences), plain language, no markdown.",
            f"Compare these options:\n{lines}",
            temperature=0.5, max_tokens=150,
        )
        if not summary:
            cheapest = min(products, key=lambda p: p["price"])
            priciest = max(products, key=lambda p: p["price"])
            summary = (
                f"{cheapest['name']} is the cheaper option at ${cheapest['price']}, "
                f"while {priciest['name']} is ${priciest['price']}."
                if cheapest is not priciest else f"{cheapest['name']} is ${cheapest['price']}."
            )

        return {"summary": summary, "table": table}
