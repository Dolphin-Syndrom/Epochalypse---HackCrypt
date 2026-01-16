"""
Health Check Routes
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "macroblank-api"
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check - verifies all dependencies are available.
    """
    # TODO: Add actual checks
    checks = {
        "api": True,
        "models_loaded": False,  # Update when models are loaded
        "database": True  # Update if using database
    }
    
    all_ready = all(checks.values())
    
    return {
        "ready": all_ready,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }
