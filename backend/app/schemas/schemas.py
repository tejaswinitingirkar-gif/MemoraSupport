from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

# Auth Schemas
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Conversation Schemas
class ConversationCreate(BaseModel):
    title: Optional[str] = "New Support Conversation"

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    memories_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationOut(BaseModel):
    id: str
    customer_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageOut]] = []

    model_config = ConfigDict(from_attributes=True)

# Chat Schemas
class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str

class MemoryItem(BaseModel):
    category: str # "preference", "issue", "solution", "unresolved", "order_information", "account_information", "communication_preference", "important_fact"
    content: str
    importance: Optional[str] = "medium" # "high", "medium", "low"
    reason: Optional[str] = None # Transparency rationale: why this memory was retrieved/used
    source_message: Optional[str] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    memories_used: List[Dict[str, Any]]
    new_memories_saved: List[Dict[str, Any]]
    conversation_id: str
    ticket_created: Optional[Dict[str, Any]] = None
    hindsight_status: Dict[str, Any]

# Ticket Schemas
class TicketCreate(BaseModel):
    title: str
    description: str
    priority: Optional[str] = "MEDIUM"
    conversation_id: Optional[str] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None

class TicketOut(BaseModel):
    id: str
    customer_id: str
    conversation_id: Optional[str] = None
    title: str
    description: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Memory Schemas
class MemoryResponse(BaseModel):
    customer_id: str
    bank_id: str
    preferences: List[str] = []
    previous_issues: List[str] = []
    successful_solutions: List[str] = []
    unresolved_issues: List[str] = []
    important_info: List[str] = []
    orders: List[str] = []
    raw_memories: List[Dict[str, Any]] = []
    is_fallback: bool = True
