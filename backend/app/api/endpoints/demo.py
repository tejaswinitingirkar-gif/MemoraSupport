from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, UserRole, Conversation, SupportTicket
from app.core.security import hash_password, create_access_token
from app.services.hindsight_service import hindsight_service

router = APIRouter()

DEMO_EMAIL = "alex.rivera@hackathon.com"

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Seeds a sample customer profile for live hackathon presentations.
    """
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if not user:
        user = User(
            name="Alex Rivera",
            email=DEMO_EMAIL,
            password_hash=hash_password("hackathon2026"),
            role=UserRole.CUSTOMER.value
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return {
        "message": "Demo user seeded successfully",
        "demo_user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "password": "hackathon2026"
        },
        "token": token
    }

@router.post("/reset-memory/{customer_id}")
def reset_customer_memory(customer_id: str, db: Session = Depends(get_db)):
    """
    Resets the Hindsight memory bank for a given customer to allow re-running demo scenarios.
    """
    bank_id = f"customer_{customer_id}"
    if bank_id in hindsight_service._fallback_memory:
        hindsight_service._fallback_memory[bank_id] = []
    
    # Clean up tickets and conversations for clean demo re-run
    db.query(SupportTicket).filter(SupportTicket.customer_id == customer_id).delete()
    db.query(Conversation).filter(Conversation.customer_id == customer_id).delete()
    db.commit()

    return {"message": f"Memory bank {bank_id} and demo state reset successfully"}
