"""
Base Detector - Abstract base class for all deepfake detection models.

Following DeepSafe's modular architecture pattern where each detector
is isolated and follows a common interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Union
from pathlib import Path
import numpy as np
from PIL import Image


class BaseDetector(ABC):
    """
    Abstract base class for deepfake detection models.
    
    All detector implementations should inherit from this class
    and implement the required abstract methods.
    """
    
    def __init__(
        self,
        model_name: str,
        model_path: Optional[Path] = None,
        device: str = "cpu",
        confidence_threshold: float = 0.5,
    ):
        """
        Initialize the detector.
        
        Args:
            model_name: Unique identifier for this detector
            model_path: Path to model weights
            device: Compute device ('cpu', 'cuda', 'mps')
            confidence_threshold: Default threshold for predictions
        """
        self.model_name = model_name
        self.model_path = model_path
        self.device = device
        self.confidence_threshold = confidence_threshold
        self.model = None
        self._is_loaded = False
    
    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready for inference."""
        return self._is_loaded
    
    @abstractmethod
    def load_model(self) -> None:
        """
        Load the model weights and prepare for inference.
        
        Must set self._is_loaded = True after successful loading.
        """
        pass
    
    @abstractmethod
    def preprocess(self, image: Image.Image) -> Any:
        """
        Preprocess an image for model inference.
        
        Args:
            image: PIL Image to preprocess
            
        Returns:
            Preprocessed input ready for the model
        """
        pass
    
    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        """
        Run inference on preprocessed input.
        
        Args:
            input_data: Preprocessed input from preprocess()
            
        Returns:
            Dict containing:
                - 'is_fake': bool prediction
                - 'confidence': float score between 0 and 1
                - 'raw_output': Original model output
        """
        pass
    
    def detect(self, image: Union[Image.Image, np.ndarray, str, Path]) -> Dict[str, Any]:
        """
        Full detection pipeline: load image -> preprocess -> predict.
        
        Args:
            image: Image as PIL Image, numpy array, or path
            
        Returns:
            Detection result dictionary
        """
        if not self.is_loaded:
            self.load_model()
        
        # Handle different input types
        if isinstance(image, (str, Path)):
            image = Image.open(image).convert("RGB")
        elif isinstance(image, np.ndarray):
            image = Image.fromarray(image).convert("RGB")
        
        # Run pipeline
        preprocessed = self.preprocess(image)
        result = self.predict(preprocessed)
        
        # Add metadata
        result["model_name"] = self.model_name
        result["threshold_used"] = self.confidence_threshold
        
        return result
    
    def unload_model(self) -> None:
        """Unload model to free memory."""
        self.model = None
        self._is_loaded = False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current detector status."""
        return {
            "model_name": self.model_name,
            "is_loaded": self._is_loaded,
            "device": self.device,
            "model_path": str(self.model_path) if self.model_path else None,
        }
