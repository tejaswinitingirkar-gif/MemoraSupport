from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, SupportTicket
from app.schemas.schemas import TicketCreate, TicketUpdate, TicketOut
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[TicketOut])
def list_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = db.query(SupportTicket).filter(
        SupportTicket.customer_id == current_user.id
    ).order_by(SupportTicket.updated_at.desc()).all()
    return tickets

@router.post("", response_model=TicketOut)
def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = SupportTicket(
        customer_id=current_user.id,
        conversation_id=ticket_in.conversation_id,
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority or "MEDIUM"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: str,
    ticket_in: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.customer_id == current_user.id
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket_in.status:
        ticket.status = ticket_in.status
    if ticket_in.priority:
        ticket.priority = ticket_in.priority
    if ticket_in.description:
        ticket.description = ticket_in.description

    db.commit()
    db.refresh(ticket)
    return ticket
