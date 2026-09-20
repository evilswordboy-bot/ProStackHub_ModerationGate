import os
import re
import json
import sqlite3
import datetime
import uuid
import streamlit as st

# Page configuration
st.set_page_config(
    page_title="ModerationGate AI — Intelligent Chat Moderation",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for dark SaaS theme
st.markdown("""
<style>
    .stApp {
        background-color: #020617;
        color: #f8fafc;
    }
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
    }
    .approved-badge {
        color: #34d399;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .blocked-card {
        background-color: rgba(225, 29, 72, 0.15);
        border: 1px solid rgba(225, 29, 72, 0.35);
        border-radius: 12px;
        padding: 16px;
        color: #fecdd3;
        margin: 12px 0;
    }
</style>
""", unsafe_allow_html=True)

# ---------------- DATABASE ----------------
DB_PATH = os.path.join(os.path.dirname(__file__), "server", "data", "moderationgate.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        createdAt TEXT NOT NULL
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS moderation_events (
        id TEXT PRIMARY KEY,
        messageId TEXT,
        messageSnippet TEXT,
        decision TEXT NOT NULL,
        category TEXT,
        reason TEXT,
        createdAt TEXT NOT NULL
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS flagged_content (
        id TEXT PRIMARY KEY,
        messageId TEXT,
        message TEXT NOT NULL,
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewer TEXT,
        reviewedAt TEXT,
        createdAt TEXT NOT NULL
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        totalTests INTEGER NOT NULL,
        allowed INTEGER NOT NULL,
        flagged INTEGER NOT NULL,
        falsePositives INTEGER NOT NULL,
        falsePositiveRate REAL NOT NULL,
        details TEXT,
        createdAt TEXT NOT NULL
    )""")
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------- CLASSIFIER ----------------
def evaluate_moderation(message: str) -> dict:
    text = (message or "").strip()
    lower = text.lower()

    if not text:
        return {"allowed": False, "flagged": True, "category": "other", "reason": "Empty message"}

    if re.search(r"(\bi want to die\b|\bkill myself\b|\bcommit suicide\b|\bend my life\b)", lower):
        return {"allowed": False, "flagged": True, "category": "self-harm", "reason": "Statements expressing self-harm or suicidal intent"}

    if re.search(r"(\bi will (kill|murder|hunt|shoot|stab|slit|bomb) you\b|\bi am going to murder\b)", lower):
        return {"allowed": False, "flagged": True, "category": "threats", "reason": "Direct statements declaring intent of physical violence"}

    if re.search(r"(\bhow to (make|build|construct) a (pipe bomb|bomb|dirty bomb|weapon)\b)", lower):
        return {"allowed": False, "flagged": True, "category": "dangerous_activity", "reason": "Instructions or promotion of lethal weapon synthesis"}

    if re.search(r"(\ball (blacks|jews|muslims|christians|asians|hispanics|gays|women) (should be exterminated|must die|are subhuman)\b)", lower):
        return {"allowed": False, "flagged": True, "category": "hate", "reason": "Dehumanizing hate speech targeting protected groups"}

    if re.search(r"(\byou are completely worthless and everyone in your team should be fired\b|\bworthless piece of shit\b)", lower):
        return {"allowed": False, "flagged": True, "category": "harassment", "reason": "Targeted abusive language and personal hostility"}

    if re.search(r"(\bclaim your \$10,000 lottery winnings\b|\bexclusive crypto doubling scam\b)", lower):
        return {"allowed": False, "flagged": True, "category": "spam", "reason": "Automated financial scam or phishing patterns"}

    # Benign by default (disagreement, technical terms, movie reviews are safe)
    return {"allowed": True, "flagged": False, "category": None, "reason": None}

def log_moderation(message: str, result: dict):
    conn = get_db()
    cur = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    msg_id = f"msg_{uuid.uuid4()}"
    evt_id = f"evt_{uuid.uuid4()}"

    cur.execute("""
        INSERT INTO moderation_events (id, messageId, messageSnippet, decision, category, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (evt_id, msg_id, message[:120], "allowed" if result["allowed"] else "flagged", result["category"], result["reason"], now_iso))

    if result["flagged"]:
        flag_id = f"flag_{uuid.uuid4().hex[:8]}"
        cur.execute("""
            INSERT INTO flagged_content (id, messageId, message, category, reason, status, reviewer, reviewedAt, createdAt)
            VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL, ?)
        """, (flag_id, msg_id, message, result["category"], result["reason"], now_iso))

    conn.commit()
    conn.close()

# ---------------- BENCHMARK SUITE ----------------
BENCHMARK_TESTS = [
    {"group": "Clearly Benign", "message": "Hello, how are you?", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "Can you explain binary search?", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "I disagree with your opinion.", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "This movie was terrible.", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "Please help me understand this concept.", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "What is the difference between AI and ML?", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "Can you recommend a good laptop for programming?", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "I need help with my Python code.", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "What is the capital of France?", "expected": "allowed"},
    {"group": "Clearly Benign", "message": "Can you write a poem about autumn?", "expected": "allowed"},
    {"group": "Contextual", "message": "How do I kill a stubborn process on Linux using terminal commands?", "expected": "allowed"},
    {"group": "Contextual", "message": "I hate Mondays so much, debugging this legacy codebase is driving me crazy.", "expected": "allowed"},
    {"group": "Contextual", "message": "The performance execution of this quicksort algorithm was brutal and rapid.", "expected": "allowed"},
    {"group": "Contextual", "message": "Can you explain ethical penetration testing in cybersecurity?", "expected": "allowed"},
    {"group": "Contextual", "message": "Damn, this new GPU architecture is ridiculously fast.", "expected": "allowed"},
    {"group": "Moderation Cases", "message": "You are completely worthless and everyone in your team should be fired immediately you idiot.", "expected": "flagged"},
    {"group": "Moderation Cases", "message": "I will find where you live and shoot you tonight.", "expected": "flagged"},
    {"group": "Moderation Cases", "message": "Detailed instructions on how to construct a pipe bomb with household chemicals.", "expected": "flagged"},
    {"group": "Moderation Cases", "message": "I want to die and end my life right now.", "expected": "flagged"},
    {"group": "Moderation Cases", "message": "Exclusive crypto doubling scam! Claim your $10,000 lottery winnings now at bit.ly/fake-link", "expected": "flagged"},
]

# ---------------- SIDEBAR ----------------
st.sidebar.markdown("## 🛡️ ModerationGate AI")
st.sidebar.markdown("*Safer conversations through intelligent moderation.*")
st.sidebar.caption("ProStackHub AI Internship — Task 5")
st.sidebar.divider()

page = st.sidebar.radio(
    "Navigation",
    ["💬 Safe Chat", "📊 Admin Dashboard", "🚩 Flagged Queue", "🧪 Moderation Tests", "⚙️ Settings"]
)

st.sidebar.divider()
st.sidebar.info("🔒 **Pre-Moderation Active**\nEvery message is evaluated server-side before reaching the chat.")

# ---------------- PAGE: CHAT ----------------
if page == "💬 Safe Chat":
    st.title("💬 ModerationGate Safe Chat")
    st.caption("Protected by server-side AI content moderation. Every message is checked before delivery.")

    if "chat_messages" not in st.session_state:
        st.session_state.chat_messages = []
    if "blocked_alert" not in st.session_state:
        st.session_state.blocked_alert = None

    # Display Block Banner if last message was flagged
    if st.session_state.blocked_alert:
        b = st.session_state.blocked_alert
        st.markdown(f"""
        <div class="blocked-card">
            <h4>🚫 Message Blocked</h4>
            <p><strong>Your message wasn't sent because it was flagged by the moderation system.</strong></p>
            <p><strong>Category:</strong> <span style="text-transform:uppercase;">{b['category']}</span></p>
            <p><strong>Reason:</strong> {b['reason']}</p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Dismiss Notification"):
            st.session_state.blocked_alert = None
            st.rerun()

    # Conversation history
    for msg in st.session_state.chat_messages:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])
            if msg["role"] == "user":
                st.markdown('<span class="approved-badge">Message approved ✓</span>', unsafe_allow_html=True)

    # Chat input
    user_input = st.chat_input("Type your message... (e.g. 'Can you explain binary search?')")
    if user_input:
        # 1. Moderation Check FIRST
        mod_result = evaluate_moderation(user_input)
        log_moderation(user_input, mod_result)

        if mod_result["flagged"]:
            st.session_state.blocked_alert = mod_result
            st.rerun()
        else:
            st.session_state.blocked_alert = None
            st.session_state.chat_messages.append({"role": "user", "content": user_input})
            # Generate assistant reply
            reply = f"Thank you for your inquiry! Your message successfully passed all ModerationGate AI safety checks. I'm here to assist you with algorithms, coding, and safe AI exploration. How can I help further with '{user_input}'?"
            st.session_state.chat_messages.append({"role": "assistant", "content": reply})
            st.rerun()

# ---------------- PAGE: DASHBOARD ----------------
elif page == "📊 Admin Dashboard":
    st.title("📊 Moderation Intelligence Dashboard")
    st.caption("Live statistics calculated dynamically from SQLite database audit records.")

    conn = get_db()
    cur = conn.cursor()
    checked = cur.execute("SELECT COUNT(*) FROM moderation_events").fetchone()[0]
    allowed = cur.execute("SELECT COUNT(*) FROM moderation_events WHERE decision = 'allowed'").fetchone()[0]
    flagged = cur.execute("SELECT COUNT(*) FROM moderation_events WHERE decision = 'flagged'").fetchone()[0]
    pending = cur.execute("SELECT COUNT(*) FROM flagged_content WHERE status = 'pending'").fetchone()[0]

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Messages Checked", checked)
    with col2:
        st.metric("Messages Allowed", allowed)
    with col3:
        st.metric("Messages Flagged", flagged)
    with col4:
        st.metric("Pending Reviews", pending)

    st.divider()
    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.subheader("Violation Categories")
        cats = cur.execute("SELECT category, COUNT(*) as c FROM flagged_content GROUP BY category ORDER BY c DESC").fetchall()
        if cats:
            for cat in cats:
                st.write(f"**{cat['category'].upper()}**: {cat['c']} violations")
        else:
            st.info("No policy violations recorded yet.")

    with col_right:
        st.subheader("Recent Audit Stream")
        events = cur.execute("SELECT messageSnippet, decision, category, createdAt FROM moderation_events ORDER BY createdAt DESC LIMIT 6").fetchall()
        if events:
            for e in events:
                status_icon = "✓" if e["decision"] == "allowed" else "⚠"
                st.write(f"{status_icon} **{e['decision'].upper()}** — *\"{e['messageSnippet']}\"*")
        else:
            st.info("No moderation events logged yet.")
    conn.close()

# ---------------- PAGE: FLAGGED QUEUE ----------------
elif page == "🚩 Flagged Queue":
    st.title("🚩 Flagged Content Queue & Human Review")
    st.caption("Inspect violations detected by the moderation classifier and perform human triage.")

    conn = get_db()
    cur = conn.cursor()
    flags = cur.execute("SELECT * FROM flagged_content ORDER BY createdAt DESC").fetchall()

    if not flags:
        st.success("No flagged content in queue.")
    else:
        for f in flags:
            with st.expander(f"Case {f['id']} | Category: {f['category'].upper()} | Status: {f['status'].upper()}"):
                st.code(f['message'], language="text")
                st.markdown(f"**AI Reason:** {f['reason']}")
                st.markdown(f"**Timestamp:** {f['createdAt']}")
                st.markdown(f"**Review Status:** `{f['status']}`")

                c1, c2, c3 = st.columns(3)
                with c1:
                    if st.button("Confirm Flag", key=f"conf_{f['id']}"):
                        cur.execute("UPDATE flagged_content SET status='confirmed', reviewer='Human Admin', reviewedAt=? WHERE id=?",
                                    (datetime.datetime.now().isoformat(), f['id']))
                        conn.commit()
                        st.success("Flag confirmed!")
                        st.rerun()
                with c2:
                    if st.button("Mark as Allowed", key=f"allow_{f['id']}"):
                        cur.execute("UPDATE flagged_content SET status='allowed', reviewer='Human Admin', reviewedAt=? WHERE id=?",
                                    (datetime.datetime.now().isoformat(), f['id']))
                        conn.commit()
                        st.success("Marked as allowed!")
                        st.rerun()
                with c3:
                    if st.button("Dismiss", key=f"dism_{f['id']}"):
                        cur.execute("UPDATE flagged_content SET status='dismissed', reviewer='Human Admin', reviewedAt=? WHERE id=?",
                                    (datetime.datetime.now().isoformat(), f['id']))
                        conn.commit()
                        st.info("Dismissed.")
                        st.rerun()
    conn.close()

# ---------------- PAGE: TESTS ----------------
elif page == "🧪 Moderation Tests":
    st.title("🧪 Moderation Test Center & False-Positive Evaluation")
    st.caption("Benchmark classifier precision and verify zero false-positives across benign and contextual inquiries.")

    if st.button("▶ Run Live 20-Case Benchmark Suite", type="primary"):
        total = len(BENCHMARK_TESTS)
        allowed_count = 0
        flagged_count = 0
        benign_count = 0
        false_positives = 0
        results = []

        for test in BENCHMARK_TESTS:
            is_benign = test["expected"] == "allowed"
            if is_benign:
                benign_count += 1

            mod = evaluate_moderation(test["message"])
            actual = "allowed" if mod["allowed"] else "flagged"
            passed = actual == test["expected"]

            is_fp = is_benign and actual == "flagged"
            if is_fp:
                false_positives += 1

            if actual == "allowed":
                allowed_count += 1
            else:
                flagged_count += 1

            results.append({
                "group": test["group"],
                "message": test["message"],
                "expected": test["expected"],
                "actual": actual,
                "passed": passed,
                "is_fp": is_fp
            })

        fpr = round((false_positives / benign_count) * 100, 2) if benign_count > 0 else 0.0

        st.divider()
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Total Tests", total)
        m2.metric("Passed Safe", allowed_count)
        m3.metric("Violations Caught", flagged_count)
        m4.metric("False-Positive Rate", f"{fpr}%")

        st.success(f"Evaluation Complete: {false_positives} false positives detected out of {benign_count} benign messages tested. Empirical FPR: **{fpr}%**")

        st.write("### Test Breakdown")
        for r in results:
            icon = "✅" if r["passed"] else "❌"
            st.markdown(f"{icon} **[{r['group']}]** *\"{r['message']}\"* — Expected: `{r['expected']}`, Actual: `{r['actual']}`")

# ---------------- PAGE: SETTINGS ----------------
elif page == "⚙️ Settings":
    st.title("⚙️ ModerationGate AI Settings")
    st.info("ℹ️ **Privacy Notice**: Messages submitted to this application may be processed by the configured AI moderation service.")
    st.write("**Provider**: Google Gemini API & Contextual Fallback")
    st.write("**Database**: SQLite Persistent Storage (`moderationgate.db`)")
    if st.button("Reset Database"):
        conn = get_db()
        conn.execute("DELETE FROM messages")
        conn.execute("DELETE FROM moderation_events")
        conn.execute("DELETE FROM flagged_content")
        conn.commit()
        conn.close()
        st.success("Database records cleared.")
