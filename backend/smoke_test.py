import json
import sys
import time
import uuid

import httpx

BASE = "http://127.0.0.1:8010/api/v1"
client = httpx.Client(timeout=30.0)
suffix = uuid.uuid4().hex[:6]
passed, failed = 0, 0


def check(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  {detail}")


def register(role, extra=None):
    payload = {
        "email": f"{role}-{suffix}@example.com",
        "password": "secret123",
        "role": role,
        "full_name": f"Test {role.title()}",
        **(extra or {}),
    }
    r = client.post(f"{BASE}/auth/register", json=payload)
    return r


print("== Phase 1: auth role branching ==")
sr = register("seller", {"business_name": "Smoke Seller Co", "business_type": "retail", "license_number": f"LIC-{suffix}"})
check("seller register 200", sr.status_code == 200, sr.text[:200])
seller_token = sr.json()["access_token"]
seller_id = sr.json().get("seller_id")

br = register("buyer", {"first_name": "Buyer", "last_name": "One", "city": "Chennai"})
check("buyer register 200", br.status_code == 200, br.text[:200])
buyer_token = br.json()["access_token"]
buyer_id = br.json().get("buyer_id")

r = client.post(f"{BASE}/auth/register", json={
    "email": f"dup-{suffix}@example.com", "password": "secret123", "role": "seller"})
r2 = client.post(f"{BASE}/auth/register", json={
    "email": f"dup-{suffix}@example.com", "password": "secret123", "role": "seller"})
check("duplicate email rejected 409", r2.status_code == 409, r2.text[:200])

login = client.post(f"{BASE}/auth/login", json={"identifier": f"buyer-{suffix}@example.com", "password": "secret123"})
check("buyer login 200 + role", login.status_code == 200 and login.json().get("role") == "buyer", login.text[:200])

me = client.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {buyer_token}"})
check("auth/me returns buyer profile", me.status_code == 200 and me.json().get("buyer") is not None, me.text[:200])

print("== Phase 1: buyer profile + products ==")
upd = client.put(f"{BASE}/buyers/me", json={"city": "Mumbai", "preferred_payment_method": "mock"},
                 headers={"Authorization": f"Bearer {buyer_token}"})
check("buyer profile update", upd.status_code == 200 and upd.json().get("city") == "Mumbai", upd.text[:200])

prod = client.post(f"{BASE}/products", json={
    "name": "Smoke Widget", "description": "A test product", "category": "electronics",
    "price": 250.0, "stock": 10, "low_stock_threshold": 2,
}, headers={"Authorization": f"Bearer {seller_token}"})
check("seller creates product", prod.status_code == 201, prod.text[:200])
product_id = prod.json().get("id")

print("== Phase 2: Mongo chat ==")
convo = client.post(f"{BASE}/conversations", json={"buyer_id": int(buyer_id)},
                    headers={"Authorization": f"Bearer {seller_token}"})
check("seller opens conversation with buyer", convo.status_code == 200, convo.text[:200])
conversation_id = convo.json().get("id")

convo2 = client.post(f"{BASE}/conversations", json={"buyer_id": int(buyer_id)},
                     headers={"Authorization": f"Bearer {seller_token}"})
check("same pair reuses conversation", convo2.status_code == 200 and convo2.json().get("id") == conversation_id, convo2.text[:200])

msg = client.post(f"{BASE}/conversations/{conversation_id}/messages", json={
    "content": "Hi, how much is the widget with bulk discount?",
    "client_message_id": f"cm-{suffix}",
}, headers={"Authorization": f"Bearer {buyer_token}"})
check("buyer sends message", msg.status_code == 200, msg.text[:300])
check("sentiment attached", msg.json().get("sentiment", {}).get("intent") == "price_inquiry", msg.text[:300])
seq = msg.json().get("sequence_number")

msg2 = client.post(f"{BASE}/conversations/{conversation_id}/messages", json={
    "content": "Hi, how much is the widget with bulk discount?",
    "client_message_id": f"cm-{suffix}",
}, headers={"Authorization": f"Bearer {buyer_token}"})
check("idempotent resend returns same message", msg2.json().get("id") == msg.json().get("id"), msg2.text[:200])

pages = client.get(f"{BASE}/conversations/{conversation_id}/messages?limit=1&cursor=",
                   headers={"Authorization": f"Bearer {seller_token}"})
check("cursor pagination works", pages.status_code == 200 and len(pages.json().get("items", [])) == 1, pages.text[:200])

convos = client.get(f"{BASE}/conversations", headers={"Authorization": f"Bearer {buyer_token}"})
check("buyer lists conversations", convos.status_code == 200 and len(convos.json().get("items", [])) == 1, convos.text[:200])

print("== Phase 4: human approval ==")
draft = client.post(f"{BASE}/conversations/{conversation_id}/drafts",
                    headers={"Authorization": f"Bearer {seller_token}"})
check("AI draft generated", draft.status_code == 200 and draft.json().get("status") == "pending", draft.text[:300])
draft_id = draft.json().get("id")

edit = client.put(f"{BASE}/ai/drafts/{draft_id}", json={"content": "Our price is 250 each; 10% off for 10+ units."},
                  headers={"Authorization": f"Bearer {seller_token}"})
check("seller edits draft", edit.status_code == 200 and "10% off" in edit.json().get("draft_content", ""), edit.text[:200])

sent = client.post(f"{BASE}/ai/drafts/{draft_id}/send", headers={"Authorization": f"Bearer {seller_token}"})
check("approved draft sent as seller message", sent.status_code == 200 and sent.json().get("message", {}).get("sender_type") == "seller", sent.text[:300])

print("== Phase 5: orders + payments ==")
order = client.post(f"{BASE}/orders", json={
    "items": [{"product_id": product_id, "quantity": 2}],
    "shipping_address": "12 Test St, Mumbai",
}, headers={"Authorization": f"Bearer {buyer_token}"})
check("buyer places order", order.status_code == 201, order.text[:300])
order_id = order.json().get("id")
check("order total computed", order.json().get("total_amount") == 500.0, order.text[:300])

pay = client.get(f"{BASE}/payments/orders/{order_id}", headers={"Authorization": f"Bearer {buyer_token}"})
check("mock payment recorded", pay.status_code == 200 and pay.json().get("status") == "completed", pay.text[:200])

prod_after = client.get(f"{BASE}/products/{product_id}")
check("stock decremented", prod_after.json().get("stock") == 8, prod_after.text[:200])

st = client.patch(f"{BASE}/orders/{order_id}/status", json={"status": "shipped"},
                  headers={"Authorization": f"Bearer {seller_token}"})
check("seller updates order status", st.status_code == 200 and st.json().get("status") == "shipped", st.text[:200])

bad = client.patch(f"{BASE}/orders/{order_id}/status", json={"status": "not-a-state"},
                   headers={"Authorization": f"Bearer {seller_token}"})
check("free-text status rejected", bad.status_code == 422, bad.text[:200])

review = client.post(f"{BASE}/orders/{order_id}/review", json={"rating": 5, "comment": "Great!"},
                     headers={"Authorization": f"Bearer {buyer_token}"})
check("buyer reviews order", review.status_code == 200 and review.json().get("is_verified_purchase") is True, review.text[:300])

print("== Phase 6: analytics + admin ==")
time.sleep(2)
an = client.get(f"{BASE}/analytics/{seller_id}?force=true")
check("analytics computed", an.status_code == 200 and an.json().get("total_orders") == 1, an.text[:300])
ts = client.get(f"{BASE}/analytics/{seller_id}/trust-score")
check("trust score computed", ts.status_code == 200 and ts.json().get("overall_score", 0) > 0, ts.text[:300])

print("== Phase 1: discovery search ==")
dis = client.get(f"{BASE}/discover?category=electronics&budget=500")
check("discovery search returns product", dis.status_code == 200 and len(dis.json().get("items", [])) >= 1, dis.text[:300])
check("trust badge in discovery", dis.json().get("items", [{}])[0].get("trust_score") is not None, dis.text[:300])

seller_pub = client.get(f"{BASE}/sellers/{seller_id}")
check("public seller profile", seller_pub.status_code == 200 and seller_pub.json().get("product_count") == 1, seller_pub.text[:200])

print("== RBAC ==")
other_payload = {
    "email": f"other-{suffix}@example.com",
    "password": "secret123",
    "role": "buyer",
    "first_name": "Other",
    "last_name": "Buyer",
}
other = client.post(f"{BASE}/auth/register", json=other_payload)
check("other buyer registers", other.status_code == 200, other.text[:200])
other_token = other.json()["access_token"]
steal = client.get(f"{BASE}/orders/{order_id}", headers={"Authorization": f"Bearer {other_token}"})
check("buyer blocked from other's order", steal.status_code == 403, steal.text[:200])
steal_msg = client.get(f"{BASE}/conversations/{conversation_id}/messages",
                       headers={"Authorization": f"Bearer {other_token}"})
check("non-participant blocked from chat", steal_msg.status_code == 403, steal_msg.text[:200])

print()
print(f"RESULT: {passed} passed, {failed} failed")
sys.exit(1 if failed else 0)