import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.session import get_db, Base
from app.services.hindsight_service import hindsight_service

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    hindsight_service._fallback_memory.clear()
    yield
    Base.metadata.drop_all(bind=engine)
    hindsight_service._fallback_memory.clear()

client = TestClient(app)

def test_auth_signup_and_login():
    res = client.post("/api/auth/signup", json={
        "name": "Customer A",
        "email": "customera@example.com",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "customera@example.com"

    res_login = client.post("/api/auth/login", json={
        "email": "customera@example.com",
        "password": "password123"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

def test_end_to_end_memory_retrieval_flow():
    """
    CRITICAL ACCEPTANCE TEST:
    Conversation 1: Customer tells agent about order #4521 delay & email preference.
    Memory stored in Hindsight.
    Conversation 2: Customer starts NEW conversation and asks about refund.
    System retrieves memories (order #4521, delay, email preference) and agent responds personalized!
    """
    res_signup = client.post("/api/auth/signup", json={
        "name": "Alice Customer",
        "email": "alice@example.com",
        "password": "password123"
    })
    token = res_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Conversation 1
    res_conv1 = client.post("/api/conversations", json={"title": "First Support Inquiry"}, headers=headers)
    conv1_id = res_conv1.json()["id"]

    msg1_res = client.post("/api/chat", json={
        "conversation_id": conv1_id,
        "message": "My order #4521 was delayed. I prefer email communication."
    }, headers=headers)
    assert msg1_res.status_code == 200
    chat1_data = msg1_res.json()
    saved_memories = [m["content"] for m in chat1_data["new_memories_saved"]]
    assert any("4521" in m for m in saved_memories) or any("email" in m for m in saved_memories)

    # Conversation 2: NEW conversation by same customer
    res_conv2 = client.post("/api/conversations", json={"title": "Follow Up Refund Inquiry"}, headers=headers)
    conv2_id = res_conv2.json()["id"]

    msg2_res = client.post("/api/chat", json={
        "conversation_id": conv2_id,
        "message": "My refund for that order hasn't arrived."
    }, headers=headers)
    assert msg2_res.status_code == 200
    chat2_data = msg2_res.json()
    
    memories_used = [m["content"] for m in chat2_data["memories_used"]]
    assert len(memories_used) > 0
    assert any("4521" in m or "email" in m or "delay" in m.lower() for m in memories_used)

    agent_response = chat2_data["response"]
    assert "#4521" in agent_response or "4521" in agent_response or "email" in agent_response.lower()

def test_customer_memory_isolation():
    """
    CRITICAL SECURITY TEST:
    Customer B must NEVER retrieve Customer A's Hindsight memories.
    """
    res_a = client.post("/api/auth/signup", json={"name": "Cust A", "email": "a@test.com", "password": "pwd"})
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    client.post("/api/chat", json={"message": "My secret order #9999 was lost. I prefer SMS."}, headers=headers_a)

    res_b = client.post("/api/auth/signup", json={"name": "Cust B", "email": "b@test.com", "password": "pwd"})
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    msg_b = client.post("/api/chat", json={"message": "What is my order status?"}, headers=headers_b)
    chat_b_data = msg_b.json()
    
    memories_b = [m["content"] for m in chat_b_data["memories_used"]]
    assert not any("9999" in m for m in memories_b)

def test_never_hallucinate_order_number():
    """
    CRITICAL REQUIREMENT 2:
    If an order number was NOT provided, the system must NEVER invent one (e.g. #4521).
    It should store: 'Customer reported a delivery delay; order number not provided.'
    """
    res_signup = client.post("/api/auth/signup", json={
        "name": "David NoOrder",
        "email": "david@example.com",
        "password": "password123"
    })
    token = res_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Customer mentions delay WITHOUT order number
    msg_res = client.post("/api/chat", json={
        "message": "My delivery is severely delayed and hasn't arrived."
    }, headers=headers)
    assert msg_res.status_code == 200
    data = msg_res.json()

    saved_memories = [m["content"] for m in data["new_memories_saved"]]
    # Must NOT invent #4521 or any fake order number
    assert not any("4521" in m for m in saved_memories)
    assert any("order number not provided" in m.lower() or "delayed" in m.lower() for m in saved_memories)

def test_successful_solution_learning_and_recall():
    """
    CRITICAL REQUIREMENT 3:
    Conversation 1:
      Customer: 'My payment failed.'
      Agent: 'Please retry the payment after reopening the payment page.'
      Customer: 'That worked. Thank you.' -> Hindsight retains solution!
    Conversation 2 (Future):
      Customer: 'My payment failed again.' -> Agent recalls previous successful solution!
    """
    res_signup = client.post("/api/auth/signup", json={
        "name": "Sarah Payment",
        "email": "sarah@example.com",
        "password": "password123"
    })
    token = res_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Payment failed
    conv1 = client.post("/api/conversations", json={"title": "Payment Trouble"}, headers=headers).json()
    client.post("/api/chat", json={
        "conversation_id": conv1["id"],
        "message": "My payment failed during checkout."
    }, headers=headers)

    # Step 2: Customer confirms solution worked
    confirm_res = client.post("/api/chat", json={
        "conversation_id": conv1["id"],
        "message": "That worked. Thank you."
    }, headers=headers)
    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()
    saved_solutions = [m for m in confirm_data["new_memories_saved"] if m["category"] == "solution"]
    assert len(saved_solutions) > 0
    assert "solution" in saved_solutions[0]["category"]

    # Step 3: New conversation days later - payment failed again
    conv2 = client.post("/api/conversations", json={"title": "Payment Issue Again"}, headers=headers).json()
    msg_repeat_res = client.post("/api/chat", json={
        "conversation_id": conv2["id"],
        "message": "My payment failed again."
    }, headers=headers)
    assert msg_repeat_res.status_code == 200
    repeat_data = msg_repeat_res.json()

    # Recalled memories must include the previous successful solution
    memories_used = repeat_data["memories_used"]
    assert any(m["category"] == "solution" or "resolved" in m["content"].lower() or "retrying" in m["content"].lower() for m in memories_used)
    
    agent_response = repeat_data["response"].lower()
    assert "reopening the payment page" in agent_response or "retrying" in agent_response or "similar payment issue" in agent_response

def test_memory_transparency_and_reasons():
    """
    CRITICAL REQUIREMENT 6:
    Every recalled memory item must have an explainable 'reason' ('Why this memory was used').
    """
    res_signup = client.post("/api/auth/signup", json={
        "name": "Tom Transparency",
        "email": "tom@example.com",
        "password": "password123"
    })
    token = res_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Conv 1
    client.post("/api/chat", json={
        "message": "My order #1234 was delayed. I prefer email communication."
    }, headers=headers)

    # Conv 2
    res2 = client.post("/api/chat", json={
        "message": "Where is my refund for that order?"
    }, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()

    assert len(data2["memories_used"]) > 0
    for mem in data2["memories_used"]:
        assert "content" in mem
        assert "reason" in mem
        assert len(mem["reason"]) > 5
