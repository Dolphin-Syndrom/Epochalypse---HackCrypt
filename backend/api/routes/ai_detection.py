"""
AI Content Detection Routes

Endpoints for detecting AI-generated content using Vertex AI.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import base64

from api.services.ai_detector import ai_detector

router = APIRouter()


class AIDetectionRequest(BaseModel):
    """Request model for base64 AI detection."""
    file_data: str  # Base64 encoded
    mime_type: str = "image/jpeg"


class AIDetectionResponse(BaseModel):
    """Response model for AI detection."""
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    media_type: Optional[str] = None


@router.get("/ai-detect/status")
async def ai_detector_status():
    """Get AI detector status."""
    return ai_detector.get_status()


@router.post("/ai-detect", response_model=AIDetectionResponse)
async def detect_ai_content(file: UploadFile = File(...)):
    """
    Detect if uploaded media is AI-generated.
    
    Args:
        file: Image or video file
        
    Returns:
        AI detection result with verdict and confidence
    """
    # Validate file type
    allowed_types = [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/webm", "video/quicktime"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    try:
        # Read file data
        file_data = await file.read()
        
        # Run AI detection
        result = await ai_detector.analyze(file_data, file.content_type)
        
        return AIDetectionResponse(**result)
        
    except Exception as e:
        return AIDetectionResponse(
            success=False,
            error=str(e)
        )


@router.post("/ai-detect/base64", response_model=AIDetectionResponse)
async def detect_ai_content_base64(request: AIDetectionRequest):
    """
    Detect if base64-encoded media is AI-generated.
    
    Args:
        request: Base64 encoded file data and mime type
        
    Returns:
        AI detection result with verdict and confidence
    """
    result = await ai_detector.analyze_base64(
        request.file_data,
        request.mime_type
    )
    
    return AIDetectionResponse(**result)
