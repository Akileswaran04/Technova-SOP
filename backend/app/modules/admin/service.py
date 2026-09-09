"""Admin Service — verification review, moderation, audit logging."""
from typing import Optional

from sqlalchemy import select, cast
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.seller_profile.models import (
    SellerVerification, SellerProfile, verificationstatus_enum,
)
from app.modules.admin.models import AuditLog
from app.modules.admin.schemas import VerificationDecision
from app.core.exceptions import NotFoundException, ValidationException


class AdminService:
    """Business logic for admin module."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_verifications(
        self, status: Optional[str] = None, limit: int = 100, offset: int = 0
    ) -> list:
        query = select(SellerVerification, SellerProfile.business_name).join(
            SellerProfile, SellerVerification.seller_id == SellerProfile.id
        )
        if status:
            query = query.where(
                SellerVerification.status == cast(status, verificationstatus_enum)
            )
        query = query.order_by(SellerVerification.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(query)
        rows = result.all()
        return [
            {
                "id": verification.id,
                "seller_id": verification.seller_id,
                "business_name": business_name,
                "verification_type": verification.verification_type.value if hasattr(verification.verification_type, "value") else verification.verification_type,
                "document_reference": verification.document_reference,
                "status": verification.status.value if hasattr(verification.status, "value") else verification.status,
                "submitted_at": verification.created_at,
            }
            for verification, business_name in rows
        ]

    async def review_verification(
        self, admin_user_id: int, verification_id: int, data: VerificationDecision
    ) -> dict:
        """Approve/reject a verification; update seller status; audit the action."""
        result = await self.db.execute(
            select(SellerVerification).where(SellerVerification.id == verification_id)
        )
        verification = result.scalar_one_or_none()
        if not verification:
            raise NotFoundException("SellerVerification", str(verification_id))

        current_status = verification.status.value if hasattr(verification.status, "value") else verification.status
        if current_status != "pending":
            raise ValidationException("Verification already reviewed")

        from datetime import datetime, timezone
        verification.status = data.decision
        verification.reviewed_by = int(admin_user_id)
        verification.reviewed_at = datetime.now(timezone.utc)
        verification.rejection_reason = data.reason if data.decision == "rejected" else None

        # Update the seller profile's verification state machine
        # (submitted → under_review → verified|rejected per validators.py)
        seller_result = await self.db.execute(
            select(SellerProfile).where(SellerProfile.id == verification.seller_id)
        )
        seller = seller_result.scalar_one_or_none()
        if seller:
            seller.verification_status = "under_review"
            await self.db.flush()
            seller.verification_status = "verified" if data.decision == "approved" else "rejected"

        # Audit log — every admin action is recorded
        audit = AuditLog(
            user_id=admin_user_id,
            action=f"verification.{data.decision}",
            resource_type="seller_verification",
            resource_id=verification_id,
            changes=data.reason or f"Verification {data.decision}",
            status=data.decision,
        )
        self.db.add(audit)
        await self.db.flush()

        return {
            "id": verification.id,
            "seller_id": verification.seller_id,
            "decision": data.decision,
            "reason": data.reason,
            "seller_verification_status": seller.verification_status.value if seller and hasattr(seller.verification_status, "value") else (seller.verification_status if seller else None),
        }

    async def list_audit_logs(self, limit: int = 100) -> list:
        result = await self.db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        logs = result.scalars().all()
        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "changes": log.changes,
                "created_at": log.created_at,
            }
            for log in logs
        ]