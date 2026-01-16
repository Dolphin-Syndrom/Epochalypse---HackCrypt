"""
MacroBlank API - Deepfake Detection Service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import detection, health, auth, ai_detection
from api.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 MacroBlank API starting up...")
    # TODO: Load models here
    yield
    # Shutdown
    print("👋 MacroBlank API shutting down...")


app = FastAPI(
    title="MacroBlank API",
    description="Adversarial Deepfake Detection System",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(detection.router, prefix="/api/v1", tags=["Detection"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(ai_detection.router, prefix="/api/v1", tags=["AI Content Detection"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "MacroBlank API",
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs"
    }
