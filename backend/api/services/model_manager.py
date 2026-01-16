"""
Model Manager - Singleton manager for all detection models.

Handles model lifecycle, loading/unloading, and provides
a unified interface for the detection routes to access models.
"""
from typing import Dict, Optional, List, Any
from pathlib import Path
import logging

from api.services.base import BaseDetector
from api.core.config import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """
    Singleton model manager for deepfake detection models.
    
    Manages the lifecycle of all detector models, handles lazy loading,
    and provides health status for the readiness endpoint.
    """
    
    _instance: Optional["ModelManager"] = None
    
    def __new__(cls) -> "ModelManager":
        """Ensure only one instance exists (singleton pattern)."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the model manager."""
        if self._initialized:
            return
        
        self._detectors: Dict[str, BaseDetector] = {}
        self._model_path = Path(settings.MODEL_PATH)
        self._default_device = "cpu"  # Start with CPU, switch to GPU if available
        self._initialized = True
        
        logger.info("ModelManager initialized")
    
    def register_detector(self, detector: BaseDetector) -> None:
        """
        Register a detector with the manager.
        
        Args:
            detector: BaseDetector instance to register
        """
        if detector.model_name in self._detectors:
            logger.warning(f"Detector '{detector.model_name}' already registered, replacing")
        
        self._detectors[detector.model_name] = detector
        logger.info(f"Registered detector: {detector.model_name}")
    
    def get_detector(self, name: str) -> Optional[BaseDetector]:
        """
        Get a detector by name.
        
        Args:
            name: Detector model name
            
        Returns:
            BaseDetector instance or None if not found
        """
        return self._detectors.get(name)
    
    def list_detectors(self) -> List[str]:
        """Get list of all registered detector names."""
        return list(self._detectors.keys())
    
    def load_all(self) -> Dict[str, bool]:
        """
        Load all registered detectors.
        
        Returns:
            Dict mapping detector names to load success status
        """
        results = {}
        for name, detector in self._detectors.items():
            try:
                detector.load_model()
                results[name] = True
                logger.info(f"Loaded detector: {name}")
            except Exception as e:
                logger.error(f"Failed to load detector {name}: {e}")
                results[name] = False
        return results
    
    def unload_all(self) -> None:
        """Unload all detectors to free memory."""
        for name, detector in self._detectors.items():
            detector.unload_model()
            logger.info(f"Unloaded detector: {name}")
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get health status of all models.
        
        Returns:
            Dict with overall status and per-model details
        """
        detector_status = {}
        all_loaded = True
        
        for name, detector in self._detectors.items():
            status = detector.get_status()
            detector_status[name] = status
            if not status["is_loaded"]:
                all_loaded = False
        
        return {
            "models_registered": len(self._detectors),
            "all_models_loaded": all_loaded and len(self._detectors) > 0,
            "model_path": str(self._model_path),
            "default_device": self._default_device,
            "detectors": detector_status,
        }
    
    async def detect_image(
        self,
        image_bytes: bytes,
        use_ensemble: bool = True,
    ) -> Dict[str, Any]:
        """
        Run detection on an image using all or specific detectors.
        
        Args:
            image_bytes: Raw image bytes
            use_ensemble: Whether to use all detectors
            
        Returns:
            Aggregated detection results
        """
        from io import BytesIO
        from PIL import Image
        
        if not self._detectors:
            return {
                "is_fake": False,
                "confidence": 0.0,
                "model_scores": {},
                "error": "No detectors registered"
            }
        
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            
            # Collect results from all detectors
            model_scores = {}
            all_predictions = []
            
            for name, detector in self._detectors.items():
                try:
                    result = detector.detect(image)
                    model_scores[name] = result.get("confidence", 0.0)
                    all_predictions.append({
                        "name": name,
                        "is_fake": result.get("is_fake", False),
                        "confidence": result.get("confidence", 0.0),
                        "fake_probability": result.get("fake_probability", 0.0)
                    })
                except Exception as e:
                    logger.error(f"Detector {name} failed: {e}")
                    model_scores[name] = {"error": str(e)}
            
            # Aggregate results (simple majority voting for now)
            fake_votes = sum(1 for p in all_predictions if p["is_fake"])
            total_votes = len(all_predictions)
            
            # Average confidence
            avg_confidence = sum(p["confidence"] for p in all_predictions) / total_votes if total_votes > 0 else 0.0
            
            # Final prediction
            is_fake = fake_votes > total_votes / 2 if total_votes > 0 else False
            
            return {
                "is_fake": is_fake,
                "confidence": avg_confidence,
                "model_scores": model_scores,
                "detailed_predictions": all_predictions
            }
            
        except Exception as e:
            logger.error(f"Image detection failed: {e}")
            return {
                "is_fake": False,
                "confidence": 0.0,
                "model_scores": {},
                "error": str(e)
            }
    
    async def detect_video(
        self,
        video_bytes: bytes,
        sample_rate: int = 10,
    ) -> Dict[str, Any]:
        """
        Run detection on a video.
        
        Args:
            video_bytes: Raw video bytes
            sample_rate: Analyze every Nth frame
            
        Returns:
            Aggregated detection results with frame analysis
        """
        # TODO: Implement in Commit 3
        return {
            "is_fake": False,
            "confidence": 0.0,
            "model_scores": {},
            "frames_analyzed": 0,
            "error": "Video detection not yet implemented"
        }


# Global instance
model_manager = ModelManager()
