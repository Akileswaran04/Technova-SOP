"""
Shared enums for TECHNOVA.
"""

from enum import Enum


class SellerProfileStatus(str, Enum):
    """Seller verification status — state machine."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class UserRole(str, Enum):
    """User roles for RBAC."""
    SELLER = "seller"
    BUYER = "buyer"
    ADMIN = "admin"


class BusinessType(str, Enum):
    """MSME business categories."""
    GROCERY = "grocery"
    CLOTHING = "clothing"
    ELECTRONICS = "electronics"
    HOME_KITCHEN = "home_kitchen"
    BEAUTY = "beauty"
    FOOD_BEVERAGES = "food_beverages"
    HANDICRAFTS = "handicrafts"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    SERVICES = "services"
    OTHER = "other"


class VerificationType(str, Enum):
    """Types of verification documents."""
    GST_CERTIFICATE = "gst_certificate"
    SHOP_LICENSE = "shop_license"
    ID_PROOF = "id_proof"
    ADDRESS_PROOF = "address_proof"
    BANK_STATEMENT = "bank_statement"
    OTHER = "other"
