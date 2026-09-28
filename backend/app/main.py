import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api.endpoints import auth, conversations, chat, memory, tickets, admin, demo

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("memorasupport")

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Customer Support Agent with Long-Term Persistent Customer Memory (Hindsight Integration)"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for hackathon development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(conversations.router, prefix=f"{settings.API_V1_STR}/conversations", tags=["Conversations"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["Chat & Agent"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memory", tags=["Customer Memory"])
app.include_router(tickets.router, prefix=f"{settings.API_V1_STR}/tickets", tags=["Support Tickets"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin & Support Dashboard"])
app.include_router(demo.router, prefix=f"{settings.API_V1_STR}/demo", tags=["Demo Utilities"])

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "hindsight_enabled": settings.HINDSIGHT_ENABLED
    }
