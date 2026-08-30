"""
Seed script — populate the database with demo data for the test seller.
Run: cd backend && venv/Scripts/python.exe seed_demo.py
"""
import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(".env")

from sqlalchemy import text
from app.infrastructure.postgres.database import AsyncSessionLocal


async def seed():
    async with AsyncSessionLocal() as db:
        # Check if data already exists
        result = await db.execute(text("SELECT COUNT(*) FROM products WHERE seller_id = 1"))
        count = result.scalar()
        if count > 0:
            print(f"Demo data already exists ({count} products). Skipping.")
            return

        now = datetime.utcnow()

        # ── Products ──
        products = [
            {
                "name": "Handmade Leather Wallet",
                "description": "Premium hand-stitched leather wallet with RFID protection.",
                "category": "Accessories",
                "price": 899.0,
                "currency": "INR",
                "stock_quantity": 25,
                "stock": 25,
                "low_stock_threshold": 5,
                "likes": 42,
                "status": "published",
                "review_count": 1,
            },
            {
                "name": "Organic Turmeric Powder (500g)",
                "description": "Pure organic turmeric sourced from Kerala farms.",
                "category": "Food & Spices",
                "price": 249.0,
                "currency": "INR",
                "stock_quantity": 120,
                "stock": 120,
                "low_stock_threshold": 20,
                "likes": 87,
                "status": "published",
                "review_count": 1,
            },
            {
                "name": "Brass Diya Set (Pack of 4)",
                "description": "Traditional handcrafted brass diyas for puja and festivals.",
                "category": "Home Decor",
                "price": 599.0,
                "currency": "INR",
                "stock_quantity": 3,
                "stock": 3,
                "low_stock_threshold": 10,
                "likes": 156,
                "status": "published",
                "review_count": 1,
            },
            {
                "name": "Cotton Kurti — Indigo Block Print",
                "description": "Elegant hand-block printed cotton kurti in indigo.",
                "category": "Clothing",
                "price": 1299.0,
                "currency": "INR",
                "stock_quantity": 18,
                "stock": 18,
                "low_stock_threshold": 5,
                "likes": 63,
                "status": "published",
                "review_count": 0,
            },
            {
                "name": "Jute Tote Bag — Eco Friendly",
                "description": "Sustainable jute tote bag with cotton handles.",
                "category": "Accessories",
                "price": 349.0,
                "currency": "INR",
                "stock_quantity": 0,
                "stock": 0,
                "low_stock_threshold": 10,
                "likes": 29,
                "status": "published",
                "review_count": 0,
            },
            {
                "name": "Spice Box — South Indian Mix",
                "description": "Authentic blend of 7 spices for South Indian cooking.",
                "category": "Food & Spices",
                "price": 449.0,
                "currency": "INR",
                "stock_quantity": 55,
                "stock": 55,
                "low_stock_threshold": 15,
                "likes": 91,
                "status": "published",
                "review_count": 1,
            },
        ]

        for p in products:
            await db.execute(
                text("""INSERT INTO products (seller_id, name, description, category, price, currency, stock_quantity, stock, low_stock_threshold, likes, status, review_count, created_at, updated_at)
                         VALUES (1, :name, :description, :category, :price, :currency, :stock_quantity, :stock, :low_stock_threshold, :likes, :status, :review_count, :created_at, :updated_at)"""),
                {"created_at": now, "updated_at": now, **p},
            )

        # ── Customers ──
        customers = [
            {"name": "Priya Sharma", "phone": "9876543210", "email": "priya@example.com"},
            {"name": "Amit Patel", "phone": "9988776655", "email": "amit@example.com"},
            {"name": "Sneha Reddy", "phone": "9123456789", "email": "sneha@example.com"},
            {"name": "Rohit Kumar", "phone": "9001234567", "email": "rohit@example.com"},
            {"name": "Ananya Singh", "phone": "8765432100", "email": "ananya@example.com"},
        ]

        for c in customers:
            await db.execute(
                text("""INSERT INTO customers (seller_id, name, phone, email, total_orders, created_at, updated_at)
                         VALUES (1, :name, :phone, :email, 0, :created_at, :updated_at)"""),
                {"created_at": now, "updated_at": now, **c},
            )

        # ── Conversations & Messages ──
        conversations = [
            {
                "customer_name": "Priya Sharma",
                "order_tag": "ORD-2024-001",
                "messages": [
                    ("customer", "Hi, do you have the leather wallet in brown color?", False),
                    ("seller", "Hello Priya! Yes, we have it in dark brown and tan. Which one would you prefer?", False),
                    ("customer", "Dark brown sounds great! What's the delivery time?", False),
                    ("seller", "We deliver within 3-5 business days to most cities. Would you like to place an order?", False),
                ],
            },
            {
                "customer_name": "Amit Patel",
                "order_tag": "ORD-2024-002",
                "messages": [
                    ("customer", "I received the turmeric powder. It's really good quality!", False),
                    ("seller", "Thank you Amit! We're glad you like it. Would you like to leave a review?", False),
                    ("customer", "Definitely! 5 stars from me. Will order again.", False),
                ],
            },
            {
                "customer_name": "Sneha Reddy",
                "order_tag": None,
                "messages": [
                    ("customer", "Are the brass diyas handcrafted?", False),
                    ("seller", "Yes Sneha, each diya is handcrafted by local artisans. They're truly one-of-a-kind pieces.", False),
                    ("customer", "Beautiful! I want to order 2 sets for Diwali.", False),
                    ("seller", "Great choice! I can offer a 10% discount for bulk orders. Shall I create the order?", False),
                    ("customer", "Yes please! That would be wonderful.", False),
                ],
            },
            {
                "customer_name": "Rohit Kumar",
                "order_tag": "ORD-2024-003",
                "messages": [
                    ("customer", "When will the jute bags be back in stock?", False),
                ],
            },
            {
                "customer_name": "Ananya Singh",
                "order_tag": None,
                "messages": [
                    ("customer", "Do you ship to Bangalore?", False),
                    ("seller", "Yes, we ship pan-India! Bangalore typically takes 2-3 days.", False),
                    ("customer", "Perfect, I will check out your products.", False),
                ],
            },
        ]

        for i, convo in enumerate(conversations):
            msg_time = now - timedelta(hours=len(conversations) - i)
            last_msg = convo["messages"][-1][1]
            await db.execute(
                text("""INSERT INTO conversations (seller_id, customer_name, order_tag, last_message, last_message_at, unread_count, created_at, updated_at)
                         VALUES (1, :customer_name, :order_tag, :last_message, :last_message_at, :unread, :created_at, :updated_at)"""),
                {
                    "customer_name": convo["customer_name"],
                    "order_tag": convo["order_tag"],
                    "last_message": last_msg,
                    "last_message_at": msg_time,
                    "unread": 1 if i == 3 else 0,
                    "created_at": msg_time,
                    "updated_at": msg_time,
                },
            )
            # Get conversation ID
            result = await db.execute(text("SELECT id FROM conversations ORDER BY id DESC LIMIT 1"))
            convo_id = result.scalar()

            for j, (sender, text_content, is_ai) in enumerate(convo["messages"]):
                m_time = msg_time + timedelta(minutes=j * 5)
                await db.execute(
                    text("""INSERT INTO messages (conversation_id, sender_type, text, is_ai_generated, created_at)
                             VALUES (:convo_id, :sender_type, :text, :is_ai, :created_at)"""),
                    {"convo_id": convo_id, "sender_type": sender, "text": text_content, "is_ai": is_ai, "created_at": m_time},
                )

        await db.commit()
        print("✅ Demo data seeded successfully!")
        print(f"   - {len(products)} products")
        print(f"   - {len(customers)} customers")
        print(f"   - {len(conversations)} conversations with messages")


if __name__ == "__main__":
    asyncio.run(seed())
