# MemoraSupport — AI Customer Support Agent with Persistent Customer Memory

> **HackwithHyderabad 3.0 Hackathon Project**  
> *"Support that remembers."*

MemoraSupport is a full-stack AI Customer Support Agent application built with **React**, **FastAPI**, and **Hindsight**. It provides long-term persistent memory for customer support interactions, remembering previous conversations, order issues, communication preferences, and successful solutions across sessions.

---

## 🚀 Problem & Solution

### Problem
Businesses struggle to deliver personalized support because chatbots and agents repeatedly ask customers for information they have already provided (order numbers, preferences, past complaints).

### Solution
MemoraSupport uses **Hindsight** as a persistent memory engine to store useful customer information in an isolated memory bank (`bank_id = f"customer_{customer_id}"`). When the same customer starts a new conversation, the AI agent recalls their past memory and provides hyper-personalized responses without asking the customer to repeat themselves.

---

## 🏗️ Architecture

```
React Frontend (Vite + Tailwind)
       │
       │ REST API (Axios + JWT)
       ▼
FastAPI Backend (Python)
       │
       ├──► SupportAgent Orchestrator
       │       │
       │       ├──► Hindsight Memory Engine (Retain / Recall / Reflect)
       │       ├──► Configurable LLM Service (OpenAI / Gemini)
       │       └──► Support Ticket Tools
       │
       └──► SQLite Database (Users, Conversations, Messages, Tickets)
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Axios, React Router v6.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy, Pydantic v2, Pytest.
- **Memory Engine**: Hindsight Persistent Memory Engine (`hindsight-client` / REST API).
- **LLM Providers**: OpenAI (`gpt-4o-mini`) & Google Gemini (`gemini-2.5-flash`), configurable via `.env`.
- **Database**: SQLite (relational app data).
- **Authentication**: JWT tokens + SHA-256 PBKDF2 password hashing.

---

## 📁 Project Structure

```
memorasupport/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── support_agent.py      # Agent Orchestrator & Tool Functions
│   │   ├── api/
│   │   │   ├── deps.py               # JWT & DB Dependencies
│   │   │   └── endpoints/            # Auth, Chat, Memory, Conversations, Tickets, Admin, Demo
│   │   ├── core/
│   │   │   ├── config.py             # Settings & Environment Config
│   │   │   └── security.py           # Password Hashing & JWT Tokens
│   │   ├── db/
│   │   │   └── session.py            # SQLite Connection Engine
│   │   ├── models/
│   │   │   └── models.py             # SQLAlchemy Models (User, Conversation, Message, SupportTicket)
│   │   ├── schemas/
│   │   │   └── schemas.py            # Pydantic Schemas
│   │   ├── services/
│   │   │   ├── hindsight_service.py  # Hindsight Memory Engine Integration & Fallback Adapter
│   │   │   └── llm_service.py        # Configurable LLM Provider Client
│   │   └── main.py                   # FastAPI Application Entry
│   ├── tests/
│   │   └── test_hindsight_agent.py   # Pytest Integration Suite
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, MemoryBadge, MemoryDrawer
│   │   ├── context/                  # AuthContext
│   │   ├── pages/                    # LandingPage, Login, Signup, Dashboard, Chat, Memory, History, Tickets, Demo, Admin
│   │   ├── services/                 # Axios API Client
│   │   ├── App.jsx                   # Router & Protected Guards
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind Directives & SaaS Styling
│   ├── package.json
│   └── vite.config.js
│
├── docs/                             # Architecture, API Docs, Demo Guide, Presentation Content
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup & Installation Instructions

### 1. Environment Variables Configuration
Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your preferred LLM provider and Hindsight settings:

```env
JWT_SECRET=super-secret-key-change-this-in-production
DATABASE_URL=sqlite:///./memorasupport.db

# LLM Provider Options: "openai" or "gemini"
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here

# Hindsight Engine Settings
HINDSIGHT_API_URL=http://localhost:8888
HINDSIGHT_ENABLED=true
```

---

### 2. Backend Setup & Run

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *FastAPI documentation will be available at `http://localhost:8000/docs`.*

---

### 3. Frontend Setup & Run

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend application will run at `http://localhost:3000`.*

---

## 🧪 Running Integration Tests

Run the automated Pytest suite to verify authentication, customer memory isolation, and the multi-conversation memory recall flow:

```bash
python -m pytest backend/tests/test_hindsight_agent.py -v
```

---

## 🎯 Verification Scenario (Hackathon Acceptance Criterion)

1. Open `http://localhost:3000/demo`.
2. Click **Start Demo & Login** to initialize customer Alex Rivera.
3. In Conversation 1, send:
   > *"My order #4521 was delayed. I prefer email communication."*
4. Click **Start NEW Conversation 2** (simulating a separate session).
5. In Conversation 2, send:
   > *"My refund for that order hasn't arrived."*
6. Observe that the AI agent **recalls order #4521 and email preference from Hindsight** and responds naturally without asking for order number or email preference again!

---

## 🛡️ Security & Memory Isolation
Each customer identity has an isolated Hindsight memory bank (`bank_id = f"customer_{customer_id}"`). Customer A cannot recall Customer B's memories under any circumstance.
