import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from model.audio.detector import AudioDeepfakeDetector

router = APIRouter(prefix="/audio", tags=["Audio Detection"])

# Initialize detector as a singleton to avoid reloading weights for every request
# Note: In a real production app with multiple workers, this would initialize per worker.
# For better resource management, we could use dependency injection or lifespan events.
detector = AudioDeepfakeDetector()

@router.post("/detect")
async def detect_audio(file: UploadFile = File(...)):
    """
    Veritas Layer 3: Audio Spoof Detection Endpoint
    """
    # 1. Validation: Ensure it's an audio file
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid audio format.")

    # 2. Temporary Storage: Generate a unique ID to prevent collisions
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")

    try:
        # 3. Intake: Stream to disk (avoids high RAM usage for large audio files)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. Layer 3: Model Inference
        # calls the predict method from AudioDeepfakeDetector
        results = detector.predict(temp_path)
        
        return {
            "status": "success",
            "filename": file.filename,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 5. Cleanup: Always delete temp files
        if os.path.exists(temp_path):
            os.remove(temp_path)
