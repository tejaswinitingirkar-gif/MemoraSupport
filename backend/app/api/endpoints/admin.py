from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, UserRole, Conversation, SupportTicket, TicketStatus
from app.api.deps import get_current_user
from app.services.hindsight_service import hindsight_service

router = APIRouter()

@router.get("/metrics")
def get_admin_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER.value).all()
    total_customers = len(customers)
    active_conversations = db.query(Conversation).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status.in_([TicketStatus.OPEN.value, TicketStatus.IN_PROGRESS.value])).count()
    resolved_tickets = db.query(SupportTicket).filter(SupportTicket.status == TicketStatus.RESOLVED.value).count()

    total_memories = 0
    total_solutions = 0
    for c in customers:
        mem = hindsight_service.get_customer_memories(c.id)
        total_memories += len(mem.get("raw_memories", []))
        total_solutions += len(mem.get("successful_solutions", []))

    return {
        "total_customers": total_customers,
        "active_conversations": active_conversations,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "total_memories": total_memories,
        "total_solutions": total_solutions
    }

@router.get("/customers")
def list_admin_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER.value).all()
    result = []
    for c in customers:
        conv_count = db.query(Conversation).filter(Conversation.customer_id == c.id).count()
        ticket_count = db.query(SupportTicket).filter(SupportTicket.customer_id == c.id).count()
        memories = hindsight_service.get_customer_memories(c.id)
        
        recent_issue = memories.get("previous_issues", ["None"])[0] if memories.get("previous_issues") else "No issues recorded"
        
        result.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "created_at": c.created_at,
            "conversations_count": conv_count,
            "tickets_count": ticket_count,
            "memories_count": len(memories.get("raw_memories", [])),
            "recent_issue": recent_issue,
            "preferences": memories.get("preferences", []),
            "successful_solutions": memories.get("successful_solutions", []),
            "orders": memories.get("orders", [])
        })
    return result

@router.get("/customers/{customer_id}")
def get_admin_customer_detail(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    conversations = db.query(Conversation).filter(Conversation.customer_id == customer_id).all()
    tickets = db.query(SupportTicket).filter(SupportTicket.customer_id == customer_id).all()
    memories = hindsight_service.get_customer_memories(customer_id)

    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "created_at": customer.created_at
        },
        "memories": memories,
        "tickets": tickets,
        "conversations": conversations
    }
