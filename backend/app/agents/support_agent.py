import logging
import json
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.hindsight_service import hindsight_service
from app.services.llm_service import llm_service
from app.models.models import SupportTicket, TicketStatus, TicketPriority

logger = logging.getLogger("memorasupport.agent")

class SupportAgent:
    """
    Intelligent AI Support Agent Orchestrator with Persistent Hindsight Customer Memory,
    Intent-driven relevance filtering, solution reuse, zero-hallucination policies, and transparency.
    """

    def process_customer_message(
        self, 
        db: Session, 
        customer_id: str, 
        customer_name: str,
        conversation_id: str, 
        message_text: str, 
        history_messages: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Complete 5-Step Agent Execution Pipeline:
        1. Recall & rank relevant memories from Hindsight for customer bank.
        2. Format memory-aware, anti-hallucination system prompt.
        3. Generate personalized LLM response.
        4. Extract and retain structured long-term customer memories (including successful solutions).
        5. Trigger agentic actions (e.g. ticket escalation if unresolved).
        """
        # Step 1: Recall relevant memories from Hindsight
        recalled_memories = hindsight_service.recall_memories(customer_id, query=message_text, limit=5)
        
        # If user indicates recurring trouble, also pull past solutions specifically
        lower_msg = message_text.lower()
        if any(w in lower_msg for w in ["again", "still", "not working", "failed", "same"]):
            past_solutions = hindsight_service.recall_solutions(customer_id, issue_context=message_text, limit=2)
            for sol in past_solutions:
                if not any(m["content"] == sol["content"] for m in recalled_memories):
                    recalled_memories.insert(0, sol)

        # Get full structured summary for fallback inspection
        structured_memories = hindsight_service.get_customer_memories(customer_id)

        # Ensure top preferences and unresolved items are present if relevant
        memories_used: List[Dict[str, Any]] = []
        seen_contents = set()

        for mem in recalled_memories:
            c = mem.get("content", "").strip()
            if c and c not in seen_contents:
                seen_contents.add(c)
                memories_used.append({
                    "content": c,
                    "category": mem.get("category", "important_fact"),
                    "importance": mem.get("importance", "medium"),
                    "reason": mem.get("reason", "Used to personalize your response.")
                })

        # Step 2: Formulate System Prompt with strict guidelines
        system_prompt = self._build_system_prompt(customer_name, memories_used)

        # Step 3: LLM Generation
        response_text = llm_service.generate_response(
            system_prompt=system_prompt,
            user_message=message_text,
            history=history_messages
        )

        # Step 4: Extract and retain structured new memories into Hindsight
        extracted_memories = llm_service.extract_memories(
            customer_message=message_text,
            agent_response=response_text,
            history=history_messages
        )

        new_memories_saved = []
        for mem in extracted_memories:
            content = mem.get("content", "").strip()
            category = mem.get("category", "important_fact")
            importance = mem.get("importance", "medium")
            if content:
                res = hindsight_service.retain_memory(
                    customer_id=customer_id,
                    content=content,
                    category=category,
                    importance=importance,
                    metadata={"conversation_id": conversation_id}
                )
                new_memories_saved.append({
                    "content": content,
                    "category": category,
                    "importance": importance,
                    "status": res
                })

        # Step 5: Check if agentic ticket creation is warranted
        ticket_created = self._handle_agentic_ticket(db, customer_id, conversation_id, message_text)

        return {
            "response": response_text,
            "memories_used": memories_used,
            "new_memories_saved": new_memories_saved,
            "ticket_created": ticket_created,
            "hindsight_status": {
                "bank_id": f"customer_{customer_id}",
                "is_fallback": structured_memories.get("is_fallback", False)
            }
        }

    def _build_system_prompt(self, customer_name: str, memories: List[Dict[str, Any]]) -> str:
        if memories:
            memories_formatted = "\n".join([
                f"- [{m.get('category', 'general').upper()}] {m.get('content')} (Reason: {m.get('reason', 'relevance')})"
                for m in memories
            ])
        else:
            memories_formatted = "No previous memories found for this customer."
        
        return f"""You are the AI Customer Support Representative for MemoraSupport.
Customer Name: {customer_name}

==================================================
RECALLED CUSTOMER MEMORIES FROM HINDSIGHT:
{memories_formatted}
==================================================

CORE HACKATHON MISSION & SUPPORT BEHAVIOR RULES:
A customer should NEVER need to repeatedly provide information that the system has already learned from previous interactions.

1. USE RECALLED MEMORIES NATURALLY:
   - Acknowledge remembered facts naturally (e.g. "I remember your previous issue with order #4521...").
   - If customer asks about an issue related to a stored order (e.g., "My refund for that order hasn't arrived"), DO NOT ask for their order number. Connect it to the stored order immediately.

2. REUSE SUCCESSFUL SOLUTIONS:
   - If the customer reports a problem (e.g. payment failed again) and a verified solution exists in recalled memories (e.g. retrying after reopening the payment page), proactively suggest that verified solution!

3. RESPECT CUSTOMER PREFERENCES AUTOMATICALLY:
   - Respect communication preferences (e.g. email preference) without needing to ask how they want to be reached.

4. NEVER INVENT OR HALLUCINATE CUSTOMER INFORMATION:
   - Never invent order numbers, dates, or facts not present in memory or in the customer's messages.
   - If an order number is genuinely missing and needed, ask politely: "I can help with that. I don't currently have the order number for this issue. Could you share it?"

5. BE EMPATHETIC, PROFESSIONAL, AND CONCISE.
"""

    def _handle_agentic_ticket(self, db: Session, customer_id: str, conversation_id: str, user_msg: str) -> Optional[Dict[str, Any]]:
        """
        Tool function to automatically open or link a support ticket for unresolved escalations.
        """
        lower_msg = user_msg.lower()
        if any(w in lower_msg for w in ["refund", "human", "escalate", "agent", "delayed"]):
            # Check if active ticket already exists for conversation
            existing = db.query(SupportTicket).filter(
                SupportTicket.conversation_id == conversation_id,
                SupportTicket.status.in_([TicketStatus.OPEN.value, TicketStatus.IN_PROGRESS.value])
            ).first()

            if not existing:
                title = "Order Delay & Refund Request" if "refund" in lower_msg else "Customer Escalation Request"
                ticket = SupportTicket(
                    customer_id=customer_id,
                    conversation_id=conversation_id,
                    title=title,
                    description=user_msg,
                    priority=TicketPriority.HIGH.value if "refund" in lower_msg else TicketPriority.MEDIUM.value,
                    status=TicketStatus.OPEN.value
                )
                db.add(ticket)
                db.commit()
                db.refresh(ticket)
                logger.info(f"Agent created support ticket #{ticket.id} for customer {customer_id}")
                return {
                    "id": ticket.id,
                    "title": ticket.title,
                    "status": ticket.status,
                    "priority": ticket.priority
                }
        return None

support_agent = SupportAgent()
