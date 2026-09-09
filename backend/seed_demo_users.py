"""
Seed demo accounts for the TECHNOVA demo build.

Provisions (idempotent — safe to run repeatedly):
  Seller 1  seller1@technova.local / demo1234   Rajesh Handicrafts   (verified)
  Seller 2  seller2@technova.local / demo1234   Meena Organics       (verified)
  Buyer 1   buyer1@technova.local  / demo1234   Arjun Mehta
  Buyer 2   buyer2@technova.local  / demo1234   Sana Khan
  Admin     admin@technova.local   / demo1234   (for verification review)

Each seller gets products in PostgreSQL and a starter conversation with a
buyer in MongoDB (messages with sentiment + sequence numbers).

Run: cd backend && .venv/Scripts/python.exe seed_demo_users.py
"""
import asyncio
from datetime import timedelta

from sqlalchemy import select

from app.core.security import hash_password
from app.infrastructure.postgres.database import AsyncSessionLocal
from app.infrastructure.mongodb.database import MongoDBClient
from app.infrastructure.mongodb.chat import ensure_chat_indexes, utcnow
from app.modules.seller_profile.models import User, SellerProfile, SellerVerification, Product
from app.modules.buyer_profile.models import BuyerProfile
from app.modules.unified_inbox.repository import ConversationRepository, MessageRepository
from app.modules.ai_communication.sentiment import analyze_message

DEMO_PASSWORD = "demo1234"

# ── Demo account definitions ────────────────────────────────────────────────

DEMO_ACCOUNTS = [
    {
        "key": "seller1",
        "email": "seller1@technova.local",
        "role": "seller",
        "full_name": "Rajesh Kumar",
        "seller": {
            "business_name": "Rajesh Handicrafts",
            "business_type": "handicrafts",
            "description": "Handcrafted brass, wood and leather goods made by artisans in Jaipur.",
            "city": "Jaipur",
            "state": "Rajasthan",
            "license_number": "LIC-DEMO-001",
        },
        "products": [
            {"name": "Brass Diya Set (Pack of 4)", "description": "Traditional handcrafted brass diyas for puja and festivals.", "category": "Home Decor", "price": 599.0, "stock": 34, "likes": 156},
            {"name": "Handmade Leather Wallet", "description": "Premium hand-stitched leather wallet with RFID protection.", "category": "Accessories", "price": 899.0, "stock": 25, "likes": 42},
            {"name": "Block Print Cotton Dupatta", "description": "Elegant hand-block printed cotton dupatta in indigo.", "category": "Clothing", "price": 749.0, "stock": 18, "likes": 63},
        ],
        "conversation_with": "buyer1",
        "thread": [
            ("buyer", "Hi! Do you have the brass diya set in stock? I need 2 sets for Diwali."),
            ("seller", "Hello! Yes, we have them in stock. Each set comes with 4 diyas, all handcrafted."),
            ("buyer", "Great — can you do a small discount for 2 sets?"),
            ("seller", "I can offer 10% off on bulk orders of 2+ sets. Shall I prepare an order?"),
            ("buyer", "Yes please! That works."),
        ],
    },
    {
        "key": "seller2",
        "email": "seller2@technova.local",
        "role": "seller",
        "full_name": "Meena Iyer",
        "seller": {
            "business_name": "Meena Organics",
            "business_type": "organic_food",
            "description": "Single-origin organic spices, turmeric and coffee from small Kerala farms.",
            "city": "Kochi",
            "state": "Kerala",
            "license_number": "LIC-DEMO-002",
        },
        "products": [
            {"name": "Organic Turmeric Powder (500g)", "description": "Pure organic turmeric sourced from Kerala farms.", "category": "Food & Spices", "price": 249.0, "stock": 120, "likes": 87},
            {"name": "Single Origin Filter Coffee (250g)", "description": "Rich, earthy filter coffee from Chikmagalur estates.", "category": "Food & Spices", "price": 399.0, "stock": 60, "likes": 134},
            {"name": "Cold Pressed Coconut Oil (1L)", "description": "First-press virgin coconut oil, no additives.", "category": "Groceries", "price": 450.0, "stock": 42, "likes": 71},
        ],
        "conversation_with": "buyer2",
        "thread": [
            ("buyer", "Is the turmeric powder really single-origin? Where is it from?"),
            ("seller", "Yes — it is grown by a single farmer cooperative near Wayanad, Kerala."),
            ("buyer", "Wonderful. How long does delivery to Mumbai take?"),
            ("seller", "2–3 business days via express courier, pan-India."),
            ("buyer", "Perfect, I'll place an order for two packs."),
        ],
    },
]

DEMO_BUYERS = [
    {"key": "buyer1", "email": "buyer1@technova.local", "full_name": "Arjun Mehta", "first_name": "Arjun", "last_name": "Mehta", "city": "Mumbai"},
    {"key": "buyer2", "email": "buyer2@technova.local", "full_name": "Sana Khan", "first_name": "Sana", "last_name": "Khan", "city": "Bengaluru"},
]

DEMO_ADMIN = {"key": "admin", "email": "admin@technova.local", "full_name": "TechNova Admin"}

# ── Helpers ─────────────────────────────────────────────────────────────────

async def _get_or_create_user(db, email, role, full_name, extra=None):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user, False
    user = User(
        email=email,
        password_hash=hash_password(DEMO_PASSWORD),
        full_name=full_name,
        role=role,
        is_active=True,
        **(extra or {}),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user, True


async def _get_or_create_seller(db, user, seller_data):
    result = await db.execute(select(SellerProfile).where(SellerProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    profile = SellerProfile(
        user_id=user.id,
        business_name=seller_data["business_name"],
        business_type=seller_data["business_type"],
        description=seller_data.get("description"),
        city=seller_data.get("city"),
        state=seller_data.get("state"),
        country="India",
        license_number=seller_data.get("license_number"),
        verification_status="verified",
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    # Mark verification as approved so the trust flow has a paper trail
    db.add(SellerVerification(
        seller_id=profile.id,
        verification_type="business_license",
        document_reference=f"doc-{user.email}",
        status="approved",
        reviewed_by=None,
        reviewed_at=utcnow(),
    ))
    return profile


async def _get_or_create_buyer(db, user, buyer_data):
    result = await db.execute(select(BuyerProfile).where(BuyerProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    profile = BuyerProfile(
        user_id=user.id,
        first_name=buyer_data["first_name"],
        last_name=buyer_data["last_name"],
        city=buyer_data.get("city"),
        country="India",
        preferred_payment_method="mock",
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


async def _seed_products(db, seller_profile, products):
    result = await db.execute(select(Product).where(Product.seller_id == seller_profile.id))
    if result.scalars().first():
        return  # already has products
    now = utcnow().replace(tzinfo=None)
    for p in products:
        db.add(Product(
            seller_id=seller_profile.id,
            name=p["name"],
            description=p["description"],
            category=p["category"],
            price=p["price"],
            stock=p["stock"],
            low_stock_threshold=5,
            likes=p.get("likes", 0),
            created_at=now,
            updated_at=now,
        ))


async def _seed_conversation(convo_repo, msg_repo, seller_profile_id, buyer_profile_id, thread):
    """Create (or reuse) the conversation and append the starter thread."""
    from app.infrastructure.mongodb.chat import get_messages_collection, get_conversations_collection
    from bson import ObjectId

    convo = await convo_repo.get_or_create(seller_profile_id, buyer_profile_id)
    msgs_coll = await get_messages_collection()
    convos_coll = await get_conversations_collection()

    # Idempotent: reseed only if the thread is missing or was left incomplete
    # (e.g. by an earlier interrupted run). Never touch extra user messages.
    existing = await msg_repo.get_page(convo["_id"], limit=200)
    if len(existing[0]) < len(thread):
        await msgs_coll.delete_many({"conversationId": convo["_id"]})
        # Reset the conversation summary so the reseeded thread rebuilds it cleanly
        await convos_coll.update_one(
            {"_id": ObjectId(convo["_id"])},
            {"$set": {"unreadCount": 0, "unreadFor": None, "lastMessage": None, "lastMessageAt": None}},
        )

        base_time = utcnow() - timedelta(hours=len(thread))
        for i, (sender_type, content) in enumerate(thread):
            msg_time = base_time + timedelta(minutes=5 * i)
            sequence = await msg_repo.next_sequence(str(convo["_id"]))
            doc = {
                "conversationId": convo["_id"],
                "senderId": buyer_profile_id if sender_type == "buyer" else seller_profile_id,
                "senderType": sender_type,
                "senderName": None,
                "content": content,
                "messageType": "text",
                "source": "in_app",
                "sentiment": analyze_message(content),
                "sequenceNumber": sequence,
                "attachments": [],
                "createdAt": msg_time,
                "readAt": None,
                "isAiGenerated": False,
            }
            # sparse unique index: omit clientMessageId entirely when unset
            await msg_repo.create(doc)
            recipient = seller_profile_id if sender_type == "buyer" else buyer_profile_id
            await convo_repo.update_last_message(str(convo["_id"]), content, recipient)

    # Recompute unread from actual unread messages — self-heals stale counters
    # (e.g. from an interrupted earlier run) and stays correct on re-runs.
    unread = await msgs_coll.count_documents({
        "conversationId": convo["_id"],
        "senderId": buyer_profile_id,
        "readAt": None,
    })
    await convos_coll.update_one(
        {"_id": ObjectId(convo["_id"])},
        {"$set": {"unreadCount": unread, "unreadFor": seller_profile_id}},
    )
    return convo


# ── Main ────────────────────────────────────────────────────────────────────

async def seed():
    buyers_by_key = {}
    sellers_by_key = {}

    # PostgreSQL: users + profiles + products
    async with AsyncSessionLocal() as db:
        for b in DEMO_BUYERS:
            user, created = await _get_or_create_user(db, b["email"], "buyer", b["full_name"])
            profile = await _get_or_create_buyer(db, user, b)
            buyers_by_key[b["key"]] = (user, profile)
            print(f"  {'created' if created else 'exists '} buyer {b['email']}")

        for s in DEMO_ACCOUNTS:
            user, created = await _get_or_create_user(db, s["email"], "seller", s["full_name"])
            profile = await _get_or_create_seller(db, user, s["seller"])
            sellers_by_key[s["key"]] = (user, profile)
            await _seed_products(db, profile, s["products"])
            print(f"  {'created' if created else 'exists '} seller {s['email']} — {s['seller']['business_name']}")

        admin_user, admin_created = await _get_or_create_user(db, DEMO_ADMIN["email"], "admin", DEMO_ADMIN["full_name"])
        print(f"  {'created' if admin_created else 'exists '} admin {DEMO_ADMIN['email']}")

        await db.commit()

    # MongoDB: conversations + starter messages
    await MongoDBClient.connect_to_db()
    await ensure_chat_indexes()
    convo_repo = ConversationRepository()
    msg_repo = MessageRepository()
    for s in DEMO_ACCOUNTS:
        seller_profile_id = sellers_by_key[s["key"]][1].id
        buyer_profile_id = buyers_by_key[s["conversation_with"]][1].id
        await _seed_conversation(convo_repo, msg_repo, seller_profile_id, buyer_profile_id, s["thread"])
        print(f"  seeded conversation {s['key']} ↔ {s['conversation_with']}")
    await MongoDBClient.close_connection()

    print()
    print("✅ Demo accounts ready (password for all: demo1234)")
    print("   Seller 1: seller1@technova.local  — Rajesh Handicrafts")
    print("   Seller 2: seller2@technova.local  — Meena Organics")
    print("   Buyer 1:  buyer1@technova.local   — Arjun Mehta")
    print("   Buyer 2:  buyer2@technova.local   — Sana Khan")
    print("   Admin:    admin@technova.local")
    print("   Or use the one-click demo buttons on the login screen.")


if __name__ == "__main__":
    asyncio.run(seed())