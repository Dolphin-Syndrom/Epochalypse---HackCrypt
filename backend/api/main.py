"""
MacroBlank API - Deepfake Detection Service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import detection, health, auth, ai_detection, audio_detection, image_detection

from api.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 MacroBlank API starting up...")
    
    # Register and load detectors for ensemble detection
    try:
        from pathlib import Path
        from api.services.model_manager import model_manager
        from api.services.universal_fake_detector import UniversalFakeDetector
        from api.services.npr_detector import NPRDetector
        
        # 1. Universal Fake Detector (CLIP-based, semantic features)
        ufd = UniversalFakeDetector(device="cpu")
        model_manager.register_detector(ufd)
        ufd.load_model()
        print("✅ Universal Fake Detector loaded")
        
        # 2. NPR Detector (ResNet-based, texture/frequency analysis)
        npr_weights = Path(__file__).parent.parent / "models" / "NPR.pth"
        npr = NPRDetector(model_path=npr_weights, device="cpu")
        model_manager.register_detector(npr)
        npr.load_model()
        print("✅ NPR Detector loaded")
        
        print("🔗 Ensemble detection enabled (UFD + NPR)")
        
    except Exception as e:
        print(f"⚠️ Failed to load detectors: {e}")
        import traceback
        traceback.print_exc()
    
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
app.include_router(audio_detection.router, prefix="/api/v1", tags=["Audio Detection"])
app.include_router(image_detection.router, prefix="/api/v1", tags=["Image Detection"])



@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "MacroBlank API",
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    # Never assume the port: 8000 is default but configurable
    uvicorn.run(app, host="0.0.0.0", port=8000)
