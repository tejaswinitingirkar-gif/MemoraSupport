from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Conversation, Message
from app.schemas.schemas import ConversationCreate, ConversationOut
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(Conversation).filter(
        Conversation.customer_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    return conversations

@router.post("", response_model=ConversationOut)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = Conversation(
        customer_id=current_user.id,
        title=conv_in.title or "New Support Conversation"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    # Initial system message greeting
    initial_msg = Message(
        conversation_id=conv.id,
        sender="agent",
        content=f"Hello {current_user.name}! I am your MemoraSupport AI Agent. How can I assist you today?"
    )
    db.add(initial_msg)
    db.commit()
    db.refresh(conv)

    return conv

@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.customer_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.customer_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully"}
