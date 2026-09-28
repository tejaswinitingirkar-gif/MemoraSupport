# MemoraSupport REST API Reference

Base URL: `http://localhost:8000/api`

## Authentication

### `POST /auth/signup`
Creates a new customer profile and returns JWT access token.
- **Request Body**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "password": "password123"
  }
  ```

### `POST /auth/login`
Authenticates existing customer.
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "password123"
  }
  ```

### `GET /auth/me`
Returns current authenticated user details.

---

## Chat & Agent Orchestration

### `POST /chat`
Core chat endpoint executing memory recall, LLM generation, new memory extraction, and ticket auto-opening.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**:
  ```json
  {
    "conversation_id": "optional-uuid",
    "message": "My order #4521 was delayed. I prefer email communication."
  }
  ```
- **Response**:
  ```json
  {
    "response": "I understand. I will assist you with order #4521 and note your email preference.",
    "memories_used": [
      { "content": "Customer reported order #4521 delivery delay" }
    ],
    "new_memories_saved": [
      { "content": "Customer prefers email communication", "category": "preference" }
    ],
    "conversation_id": "uuid",
    "ticket_created": null,
    "hindsight_status": {
      "bank_id": "customer_uuid",
      "is_fallback": false
    }
  }
  ```

---

## Customer Memory (Hindsight)

### `GET /memory`
Retrieves categorized memory bank (Preferences, Previous Issues, Solutions, Unresolved).

### `GET /memory/search?q=query`
Recalls memories matching search query using Hindsight multi-strategy search.

---

## Support Tickets

### `GET /tickets`
Lists support tickets for authenticated customer.

### `POST /tickets`
Creates a new support ticket manually.

### `PATCH /tickets/{id}`
Updates status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) or priority.
