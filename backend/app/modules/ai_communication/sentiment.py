"""
Sentiment & intent analysis + AI draft replies.

Rule-based/heuristic so the module works with zero external API keys.
Structured so a real LLM provider can be swapped in later behind the same
interface (the existing module's ai_interactions logging stays untouched).

Sentiment result shape:
    {
        "label": "positive" | "neutral" | "negative",
        "score": float 0..1,
        "intent": "price_inquiry" | "availability" | "complaint" | "greeting" | "thanks" | "general",
        "lead_score": int 0..100,
        "strategy": "discount" | "inform" | "empathize" | "engage" | "acknowledge" | "respond",
        "draft": str,  # suggested seller reply (never auto-sent)
    }
"""
import re
from typing import Optional

POSITIVE_WORDS = {
    "great", "good", "awesome", "excellent", "love", "loved", "like", "liked",
    "perfect", "best", "amazing", "nice", "thank", "thanks", "thankyou",
    "happy", "satisfied", "works", "working", "beautiful", "quality", "fast",
    "quick", "recommend", "impressed", "wonderful", "fantastic", "superb",
}
NEGATIVE_WORDS = {
    "bad", "worst", "terrible", "awful", "hate", "hated", "broken", "broke",
    "not working", "damaged", "poor", "late", "delayed", "delay", "refund",
    "complaint", "issue", "problem", "disappointed", "waste", "return",
    "cancel", "cancelled", "slow", "never", "wrong", "unhappy", "useless",
    "expired", "missing", "scam", "fraud",
}
PRICE_WORDS = {"price", "cost", "how much", "quote", "pricing", "discount", "deal", "offer", "rate"}
AVAILABILITY_WORDS = {"available", "stock", "in stock", "have", "when", "delivery", "shipping", "arrive", "dispatch"}


def _contains_any(text: str, words: set) -> bool:
    lowered = text.lower()
    return any(w in lowered for w in words)


def analyze_message(content: str) -> dict:
    """Analyze a message and produce sentiment/intent/lead-score + draft."""
    text = content.strip()
    lowered = text.lower()

    pos_hits = sum(1 for w in POSITIVE_WORDS if w in lowered)
    neg_hits = sum(1 for w in NEGATIVE_WORDS if w in lowered)

    if neg_hits > pos_hits:
        label, score = "negative", min(0.95, 0.5 + 0.15 * neg_hits)
    elif pos_hits > neg_hits:
        label, score = "positive", min(0.95, 0.5 + 0.15 * pos_hits)
    else:
        label, score = "neutral", 0.5

    # Intent detection — complaints take priority over availability (e.g.
    # "delivery was late" is a complaint, not an availability question)
    intent = "general"
    if _contains_any(text, {"refund", "complaint", "issue", "problem", "broken", "damaged", "wrong", "late", "delay", "not received", "never arrived"}):
        intent = "complaint"
    elif _contains_any(text, PRICE_WORDS):
        intent = "price_inquiry"
    elif _contains_any(text, AVAILABILITY_WORDS):
        intent = "availability"
    elif re.search(r"\b(hi|hello|hey)\b", lowered):
        intent = "greeting"
    elif _contains_any(text, {"thank", "thanks"}):
        intent = "thanks"

    # Lead score heuristic
    lead_score = 50
    if intent in ("price_inquiry", "availability"):
        lead_score = 80
    if "complaint" in intent:
        lead_score = 25
    if label == "positive":
        lead_score = min(95, lead_score + 10)
    if label == "negative":
        lead_score = max(10, lead_score - 20)
    if len(text) > 120:
        lead_score = min(95, lead_score + 5)

    strategy = {
        "price_inquiry": "inform",
        "availability": "inform",
        "complaint": "empathize",
        "greeting": "engage",
        "thanks": "acknowledge",
        "general": "respond",
    }[intent]

    return {
        "label": label,
        "score": round(score, 2),
        "intent": intent,
        "lead_score": lead_score,
        "strategy": strategy,
        "draft": draft_reply(intent, label),
    }


def draft_reply(intent: str, label: str) -> str:
    """Template-based draft reply. Never auto-sent — seller must approve."""
    if intent == "price_inquiry":
        return (
            "Thanks for reaching out! Our pricing is competitive and we offer "
            "bulk discounts for larger orders. Could you share the quantity you're "
            "interested in so I can send you an exact quote?"
        )
    if intent == "availability":
        return (
            "Great question — let me check current stock and get back to you "
            "shortly with availability and delivery options."
        )
    if intent == "complaint":
        return (
            "I'm really sorry about this experience — that's not the standard we "
            "aim for. Please share your order details and I'll resolve this for "
            "you right away."
        )
    if intent == "greeting":
        return "Hello! Thanks for reaching out to our store. How can I help you today?"
    if intent == "thanks":
        return "You're very welcome! Let us know if you need anything else — happy to help."
    if label == "positive":
        return "Thanks so much for your kind words — it means a lot to us! Feel free to reach out anytime."
    if label == "negative":
        return "Thank you for flagging this — we take your feedback seriously and will address it promptly."
    return "Thank you for your message. Let me look into this and get back to you shortly."


def classify(conversation_history: Optional[list] = None) -> dict:
    """Placeholder for future conversation-level analysis."""
    return {"conversation_sentiment": "neutral", "summary": None}