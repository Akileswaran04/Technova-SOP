"""
Shared utility functions for TECHNOVA.
"""

import uuid
from datetime import datetime, timezone


def generate_id() -> str:
    """Generate a unique ID (for non-UUID contexts)."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)
