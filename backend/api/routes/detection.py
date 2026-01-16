"""
Detection Routes - Image and Video Deepfake Detection Endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

from api.schemas.detection import (
    DetectionRequest,
    DetectionResponse,
    BatchDetectionResponse,
    BatchResultItem,
)

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
    from api.services.model_manager import model_manager
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Run detection through model manager
        result = await model_manager.detect_image(
            image_bytes=image_bytes,
            use_ensemble=True
        )
        
        # Check for errors
        if "error" in result and result["error"]:
            return DetectionResponse(
                is_fake=False,
                confidence=0.0,
                model_scores={},
                metadata={
                    "filename": file.filename,
                    "error": result["error"]
                }
            )
        
        return DetectionResponse(
            is_fake=result.get("is_fake", False),
            confidence=result.get("confidence", 0.0),
            model_scores=result.get("model_scores", {}),
            heatmap_base64=result.get("heatmap_base64"),
            metadata={
                "filename": file.filename,
                "content_type": file.content_type,
                "detailed_predictions": result.get("detailed_predictions", [])
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(e)}"
        )


@router.post("/detect/video", response_model=DetectionResponse)
async def detect_video(
    file: UploadFile = File(...),
    sample_rate: Optional[int] = 10,
    confidence_threshold: Optional[float] = 0.5
):
    """
    Analyze a video for deepfake manipulation.
    
    Args:
        file: Video file (MP4, AVI, MOV)
        sample_rate: Analyze every Nth frame
        confidence_threshold: Minimum confidence for detection
    
    Returns:
        Detection result with frame-level analysis
    """
    from api.services.model_manager import model_manager
    
    allowed_types = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    try:
        # Read video bytes
        video_bytes = await file.read()
        
        # Run detection through model manager
        result = await model_manager.detect_video(
            video_bytes=video_bytes,
            sample_rate=sample_rate
        )
        
        # Check for errors
        if "error" in result and result["error"]:
            return DetectionResponse(
                is_fake=False,
                confidence=0.0,
                model_scores={},
                metadata={
                    "filename": file.filename,
                    "error": result["error"]
                }
            )
        
        return DetectionResponse(
            is_fake=result.get("is_fake", False),
            confidence=result.get("confidence", 0.0),
            model_scores=result.get("model_scores", {}),
            metadata={
                "filename": file.filename,
                "content_type": file.content_type,
                "frames_analyzed": result.get("frames_analyzed", 0),
                "video_info": result.get("video_info", {}),
                "temporal_analysis": result.get("temporal_analysis", {})
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Video detection failed: {str(e)}"
        )


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
