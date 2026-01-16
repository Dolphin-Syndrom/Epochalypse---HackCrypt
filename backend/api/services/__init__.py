"""Services module for deepfake detection."""
from api.services.model_manager import ModelManager
from api.services.npr_detector import NPRDetector

__all__ = ["ModelManager", "NPRDetector"]
