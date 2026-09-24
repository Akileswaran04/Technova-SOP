"""Negotiation Service — business logic.

Symmetric offer/counter-offer model: a pending offer's "offered_by" marks who
sent it, so the *other* side is the one allowed to accept/reject/counter it.
`create_offer` starts a fresh thread (round 1); every response after that —
from either side — goes through `respond_to_offer`.

Bounds are always enforced server-side (never trust a client-sent price
against the seller's floor), and nothing is auto-committed to a real order
until `checkout_offer` is called against an *accepted* offer.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.negotiation.repository import NegotiationRepository
from app.modules.negotiation.schemas import NegotiationRuleUpsert, OfferCreate, OfferRespondRequest, OfferCheckoutRequest
from app.modules.seller_profile.models import SellerProfile, Product
from app.modules.buyer_profile.models import BuyerProfile, Address
from app.modules.orders.service import OrderService
from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException


def _rule_response(rule) -> dict:
    return {
        "id": rule.id,
        "product_id": rule.product_id,
        "enabled": rule.enabled,
        "min_price": rule.min_price,
        "auto_accept_threshold": rule.auto_accept_threshold,
        "counter_offer_range_pct": rule.counter_offer_range_pct,
        "max_rounds": rule.max_rounds,
        "quantity_discount_rules": rule.quantity_discount_rules,
    }


def _offer_response(offer) -> dict:
    return {
        "id": offer.id,
        "product_id": offer.product_id,
        "product_name": offer.product.name if offer.product else None,
        "buyer_id": offer.buyer_id,
        "seller_id": offer.seller_id,
        "round": offer.round,
        "quantity": offer.quantity,
        "offered_price": offer.offered_price,
        "offered_by": offer.offered_by,
        "status": offer.status,
        "message": offer.message,
        "created_at": offer.created_at,
        "resolved_at": offer.resolved_at,
        "fulfilled_order_id": offer.fulfilled_order_id,
    }


class NegotiationService:
    """Business logic for negotiation rules and offers."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NegotiationRepository(db)

    async def _get_buyer_id(self, user_id: int) -> int:
        result = await self.db.execute(select(BuyerProfile).where(BuyerProfile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise ForbiddenException("Only buyers can negotiate")
        return profile.id

    async def _get_seller_id(self, user_id: int) -> int:
        result = await self.db.execute(select(SellerProfile).where(SellerProfile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise ForbiddenException("Only sellers can manage negotiation rules")
        return profile.id

    async def _get_product(self, product_id: int) -> Product:
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundException("Product", str(product_id))
        return product

    # ── Seller: rule configuration ──

    async def get_rule(self, user_id: int, product_id: int) -> Optional[dict]:
        seller_id = await self._get_seller_id(user_id)
        product = await self._get_product(product_id)
        if product.seller_id != seller_id:
            raise ForbiddenException("Not your product")
        rule = await self.repo.get_rule(product_id)
        return _rule_response(rule) if rule else None

    async def upsert_rule(self, user_id: int, product_id: int, data: NegotiationRuleUpsert) -> dict:
        seller_id = await self._get_seller_id(user_id)
        product = await self._get_product(product_id)
        if product.seller_id != seller_id:
            raise ForbiddenException("Not your product")
        if data.min_price > product.price:
            raise ValidationException("Minimum price cannot exceed the listed price")
        if data.auto_accept_threshold is not None and data.auto_accept_threshold < data.min_price:
            raise ValidationException("Auto-accept threshold cannot be below the minimum price")

        rule = await self.repo.upsert_rule(product_id, data.model_dump())
        return _rule_response(rule)

    # ── Buyer: suggestion + starting an offer ──

    async def get_suggestion(self, product_id: int, quantity: int = 1) -> dict:
        product = await self._get_product(product_id)
        rule = await self.repo.get_rule(product_id)
        if not rule or not rule.enabled:
            return {
                "product_id": product_id, "listed_price": product.price,
                "suggested_price": product.price, "quantity": quantity,
                "negotiation_enabled": False,
            }
        # Midpoint between the listed price and the seller's floor, rounded to
        # a clean number — the AI-suggested opening offer (PRD §18).
        suggested = round((product.price + rule.min_price) / 2, 2)
        return {
            "product_id": product_id, "listed_price": product.price,
            "suggested_price": max(suggested, rule.min_price), "quantity": quantity,
            "negotiation_enabled": True,
        }

    async def create_offer(self, user_id: int, data: OfferCreate) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        product = await self._get_product(data.product_id)
        rule = await self.repo.get_rule(data.product_id)
        if not rule or not rule.enabled:
            raise ValidationException("Negotiation is not available for this product")

        thread = await self.repo.list_thread(data.product_id, buyer_id)
        current_round = len([o for o in thread if o.offered_by == "buyer"]) + 1
        if current_round > rule.max_rounds:
            raise ValidationException("Negotiation round limit reached for this item")

        status = "pending"
        if data.offered_price < rule.min_price:
            status = "rejected"
        elif rule.auto_accept_threshold is not None and data.offered_price >= rule.auto_accept_threshold:
            status = "accepted"

        offer = await self.repo.create_offer({
            "product_id": data.product_id,
            "buyer_id": buyer_id,
            "seller_id": product.seller_id,
            "round": current_round,
            "quantity": data.quantity,
            "offered_price": data.offered_price,
            "offered_by": "buyer",
            "status": status,
            "message": data.message,
            "resolved_at": datetime.utcnow() if status != "pending" else None,
        })
        return _offer_response(offer)

    # ── Either side: respond to a pending offer ──

    async def respond_to_offer(self, user_id: int, user_role: str, offer_id: int, data: OfferRespondRequest) -> dict:
        offer = await self.repo.get_offer(offer_id)
        if not offer:
            raise NotFoundException("NegotiationOffer", str(offer_id))
        if offer.status != "pending":
            raise ValidationException("This offer has already been resolved")

        # The side that did NOT send this offer is the one who may respond.
        if offer.offered_by == "buyer":
            if user_role != "seller":
                raise ForbiddenException("Waiting on the seller to respond")
            seller_id = await self._get_seller_id(user_id)
            if offer.seller_id != seller_id:
                raise ForbiddenException("Not your offer to respond to")
            responder_role, other_role = "seller", "buyer"
        else:
            if user_role != "buyer":
                raise ForbiddenException("Waiting on the buyer to respond")
            buyer_id = await self._get_buyer_id(user_id)
            if offer.buyer_id != buyer_id:
                raise ForbiddenException("Not your offer to respond to")
            responder_role, other_role = "buyer", "seller"

        if data.action == "accept":
            updated = await self.repo.update_offer(offer_id, {"status": "accepted", "resolved_at": datetime.utcnow()})
            return _offer_response(updated)

        if data.action == "reject":
            updated = await self.repo.update_offer(offer_id, {"status": "rejected", "resolved_at": datetime.utcnow()})
            return _offer_response(updated)

        # counter
        rule = await self.repo.get_rule(offer.product_id)
        if not rule:
            raise ValidationException("Negotiation is no longer available for this product")
        if offer.round >= rule.max_rounds:
            raise ValidationException("Negotiation round limit reached for this item")
        if data.counter_price is None:
            raise ValidationException("counter_price is required to counter")
        if responder_role == "seller" and data.counter_price < rule.min_price:
            raise ValidationException("Counter price cannot be below your own minimum price")

        await self.repo.update_offer(offer_id, {"status": "countered", "resolved_at": datetime.utcnow()})
        new_offer = await self.repo.create_offer({
            "product_id": offer.product_id,
            "buyer_id": offer.buyer_id,
            "seller_id": offer.seller_id,
            "round": offer.round + 1,
            "quantity": offer.quantity,
            "offered_price": data.counter_price,
            "offered_by": responder_role,
            "status": "pending",
            "message": data.message,
        })
        return _offer_response(new_offer)

    # ── Listing ──

    async def list_thread(self, user_id: int, product_id: int) -> list[dict]:
        buyer_id = await self._get_buyer_id(user_id)
        thread = await self.repo.list_thread(product_id, buyer_id)
        return [_offer_response(o) for o in thread]

    async def list_for_seller(self, user_id: int, status: Optional[str] = None) -> list[dict]:
        seller_id = await self._get_seller_id(user_id)
        offers = await self.repo.list_for_seller(seller_id, status=status)
        return [_offer_response(o) for o in offers]

    async def list_for_buyer(self, user_id: int, status: Optional[str] = None) -> list[dict]:
        buyer_id = await self._get_buyer_id(user_id)
        offers = await self.repo.list_for_buyer(buyer_id, status=status)
        return [_offer_response(o) for o in offers]

    # ── Checkout at the negotiated price ──

    async def checkout_offer(self, user_id: int, offer_id: int, data: OfferCheckoutRequest) -> dict:
        buyer_id = await self._get_buyer_id(user_id)
        offer = await self.repo.get_offer(offer_id)
        if not offer:
            raise NotFoundException("NegotiationOffer", str(offer_id))
        if offer.buyer_id != buyer_id:
            raise ForbiddenException("Not your offer")
        if offer.status != "accepted":
            raise ValidationException("Only an accepted offer can be checked out")
        if offer.fulfilled_order_id is not None:
            raise ValidationException("This offer has already been used for an order")

        address = (await self.db.execute(
            select(Address).where(Address.id == data.address_id, Address.buyer_id == buyer_id)
        )).scalar_one_or_none()
        if not address:
            raise NotFoundException("Address", str(data.address_id))
        shipping_address = ", ".join(
            part for part in [address.line1, address.line2, address.city, address.state, address.postal_code, address.country] if part
        )

        order_service = OrderService(self.db)
        order = await order_service.create_order(
            user_id,
            OrderCreate(
                items=[OrderItemCreate(product_id=offer.product_id, quantity=offer.quantity)],
                shipping_address=shipping_address,
                notes=data.notes,
                payment_method=data.payment_method or "mock",
            ),
            price_overrides={offer.product_id: offer.offered_price},
        )
        await self.repo.update_offer(offer_id, {"fulfilled_order_id": order["id"]})
        return order
