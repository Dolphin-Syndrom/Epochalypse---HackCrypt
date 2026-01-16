"""
Detection Routes - Image and Video Deepfake Detection Endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional

from api.schemas.detection import (
    DetectionRequest,
    DetectionResponse,
    BatchDetectionResponse,
    BatchResultItem,
)
from api.services.genconvit_service import get_genconvit_service

router = APIRouter()


@router.post("/detect/image", response_model=DetectionResponse)
async def detect_image(
    file: UploadFile = File(...),
    confidence_threshold: Optional[float] = 0.5
):
    """
    Analyze an image for deepfake manipulation.
    
    Args:
        file: Image file (JPEG, PNG, WebP)
        confidence_threshold: Minimum confidence for detection (0.0 - 1.0)
    
    Returns:
        Detection result with confidence scores
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    # TODO: Implement actual detection logic for images
    # For now, return placeholder
    
    return DetectionResponse(
        is_fake=False,
        confidence=0.95,
        model_scores={
            "image_detector": 0.92,
            "ensemble": 0.95
        },
        metadata={
            "filename": file.filename,
            "content_type": file.content_type
        }
    )


@router.post("/detect/video", response_model=DetectionResponse)
async def detect_video(
    file: UploadFile = File(...),
    num_frames: Optional[int] = Query(15, ge=5, le=60, description="Number of frames to analyze"),
    model: Optional[str] = Query("ed", description="Model variant: ed, vae, or genconvit")
):
    """
    Analyze a video for deepfake manipulation using GenConViT.
    
    Args:
        file: Video file (MP4, AVI, MOV)
        num_frames: Number of frames to extract and analyze (5-60)
        model: Model variant to use (ed=faster, vae, genconvit=both)
    
    Returns:
        Detection result with confidence scores
    """
    allowed_types = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/x-matroska"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    if model not in ["ed", "vae", "genconvit"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid model. Allowed: ed, vae, genconvit"
        )
    
    try:
        # Read video bytes
        video_bytes = await file.read()
        
        # Get GenConViT service
        service = get_genconvit_service(net=model, num_frames=num_frames)
        
        # Run detection
        result = service.detect_video_bytes(
            video_bytes=video_bytes,
            filename=file.filename or "video.mp4",
            num_frames=num_frames
        )
        
        if "error" in result:
            raise HTTPException(status_code=422, detail=result["error"])
        
        return DetectionResponse(
            is_fake=result["is_fake"],
            confidence=result["confidence"] / 100,  # Normalize to 0-1
            model_scores={
                result["model"]: result["raw_score"],
            },
            metadata={
                "filename": file.filename,
                "frames_analyzed": result["frames_analyzed"],
                "processing_time_ms": result["processing_time_ms"],
                "prediction": result["prediction"],
                "model_variant": model
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@router.post("/detect/batch", response_model=BatchDetectionResponse)
async def detect_batch(files: list[UploadFile] = File(...)):
    """
    Batch analyze multiple files for deepfake manipulation.
    
    Args:
        files: List of image/video files
    
    Returns:
        Batch detection results
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 files per batch"
        )
    
    # TODO: Implement batch processing
    results = []
    for file in files:
        results.append(BatchResultItem(
            filename=file.filename,
            is_fake=False,
            confidence=0.90
        ))
    
    return BatchDetectionResponse(
        total_files=len(files),
        fake_count=0,
        real_count=len(files),
        results=results
    )
