from typing import List, Optional


from fastapi import APIRouter, Depends, Query

from app.core.dependencies import require_roles
from app.modules.admin.dependencies import get_admin_service
from app.modules.admin.schemas import (
    VerificationResponse, VerificationDecision, AuditLogResponse,
)
from app.modules.admin.service import AdminService

router = APIRouter()

admin_only = require_roles("admin")


@router.get("/verifications", response_model=List[VerificationResponse])
async def list_verifications(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _=Depends(admin_only),
    service: AdminService = Depends(get_admin_service),
):
    return await service.list_verifications(status=status, limit=limit, offset=offset)


@router.patch("/verifications/{verification_id}")
async def review_verification(
    verification_id: int,
    data: VerificationDecision,
    admin_user=Depends(admin_only),
    service: AdminService = Depends(get_admin_service),
):
    return await service.review_verification(admin_user.id, verification_id, data)


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    _=Depends(admin_only),
    service: AdminService = Depends(get_admin_service),
):
    return await service.list_audit_logs(limit=limit)