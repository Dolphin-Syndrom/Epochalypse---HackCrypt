import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from model.image.detector import ImageDeepfakeDetector

router = APIRouter(prefix="/image", tags=["Image Detection"])

# Initialize detector as a singleton (loads weights once)
# Using VAE variant by default - can be changed via query param
_detectors = {}

def get_detector(variant: str = "vae") -> ImageDeepfakeDetector:
    """Get or create detector for the specified variant."""
    if variant not in _detectors:
        try:
            _detectors[variant] = ImageDeepfakeDetector(variant=variant)
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to load image detector ({variant}): {str(e)}"
            )
    return _detectors[variant]


@router.post("/detect")
async def detect_image(
    file: UploadFile = File(...),
    variant: str = Query("vae", description="Model variant: 'vae' or 'ed'")
):
    """
    Veritas Layer 2: Image Deepfake Detection Endpoint
    
    Analyzes an uploaded image for signs of AI manipulation/deepfake.
    Uses ConvNeXt + MTCNN face extraction for robust detection.
    
    - **file**: Image file (jpg, jpeg, png, webp)
    - **variant**: Model variant to use ('vae' or 'ed')
    
    Returns detection verdict, confidence score, and probability distribution.
    """
    # 1. Validation: Ensure it's an image file
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type: {file.content_type}. Allowed: {allowed_types}"
        )

    # 2. Temporary Storage: Generate a unique ID to prevent collisions
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Preserve file extension for proper handling
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}{file_ext}")

    try:
        # 3. Intake: Stream to disk
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. Get detector and run inference
        detector = get_detector(variant)
        results = detector.predict(temp_path)
        
        # Check for errors in results
        if "error" in results:
            raise HTTPException(status_code=500, detail=results["error"])
        
        # 5. Format response
        return {
            "status": "success",
            "filename": file.filename,
            "model": f"genconvit_{variant}",
            "results": {
                "verdict": results["verdict"],
                "confidence": results["confidence"],
                "confidence_percentage": round(results["confidence"] * 100, 2),
                "is_fake": "Fake" in results["verdict"],
                "is_reliable": results["confidence"] >= 0.75,
                "probabilities": results["probabilities"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    finally:
        # 6. Cleanup: Always delete temp files
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/health")
async def image_detection_health():
    """Check if image detection service is available."""
    try:
        # Try to initialize the default detector
        detector = get_detector("vae")
        return {
            "status": "healthy",
            "service": "image_detection",
            "model": "genconvit_vae",
            "device": str(detector.device)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "image_detection",
            "error": str(e)
        }
