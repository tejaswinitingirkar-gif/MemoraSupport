import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Conversation, Message
from app.schemas.schemas import ChatRequest, ChatResponse
from app.api.deps import get_current_user
from app.agents.support_agent import support_agent

router = APIRouter()

@router.post("", response_model=ChatResponse)
def chat(
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not chat_in.message or not chat_in.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    # Get or create active conversation for customer
    conversation = None
    if chat_in.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == chat_in.conversation_id,
            Conversation.customer_id == current_user.id
        ).first()

    if not conversation:
        conversation = Conversation(
            customer_id=current_user.id,
            title=chat_in.message[:40] + ("..." if len(chat_in.message) > 40 else "")
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Retrieve conversation message history for LLM context
    previous_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()

    history_formatted = []
    for msg in previous_messages:
        role = "user" if msg.sender == "customer" else "assistant"
        history_formatted.append({"role": role, "content": msg.content})

    # Save customer message to DB
    user_msg_db = Message(
        conversation_id=conversation.id,
        sender="customer",
        content=chat_in.message
    )
    db.add(user_msg_db)
    db.commit()

    # Process through SupportAgent Orchestrator (hindsight recall + prompt + LLM + memory retain)
    agent_result = support_agent.process_customer_message(
        db=db,
        customer_id=current_user.id,
        customer_name=current_user.name,
        conversation_id=conversation.id,
        message_text=chat_in.message,
        history_messages=history_formatted
    )

    # Save agent response to DB
    agent_msg_db = Message(
        conversation_id=conversation.id,
        sender="agent",
        content=agent_result["response"],
        memories_json=json.dumps(agent_result["memories_used"])
    )
    db.add(agent_msg_db)

    # Update conversation timestamp and title if first message
    conversation.updated_at = datetime.now(timezone.utc)
    if len(previous_messages) == 0:
        conversation.title = chat_in.message[:40] + ("..." if len(chat_in.message) > 40 else "")
    db.commit()

    return {
        "response": agent_result["response"],
        "memories_used": agent_result["memories_used"],
        "new_memories_saved": agent_result["new_memories_saved"],
        "conversation_id": conversation.id,
        "ticket_created": agent_result["ticket_created"],
        "hindsight_status": agent_result["hindsight_status"]
    }
