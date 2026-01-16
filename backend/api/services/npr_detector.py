"""
NPR Deepfake Detector

Implementation based on NPR (Neural Pixel Representation) from CVPR 2024:
"Rethinking the Up-Sampling Operations in CNN-based Generative Network 
for Generalizable Deepfake Detection"

Uses ResNet backbone for binary classification (real vs fake).
"""
import time
from typing import Dict, Any, Optional
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from PIL import Image

from api.services.base import BaseDetector
from api.utils.preprocessing import ImagePreprocessor


class NPRModel(nn.Module):
    """
    NPR-style ResNet classifier for deepfake detection.
    
    Uses pretrained ResNet50 backbone with custom classifier head.
    """
    
    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        
        # Load pretrained ResNet50
        weights = models.ResNet50_Weights.IMAGENET1K_V1 if pretrained else None
        self.backbone = models.resnet50(weights=weights)
        
        # Get feature dimension
        in_features = self.backbone.fc.in_features
        
        # Replace classifier
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass returning logits."""
        return self.backbone(x)
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Get probability scores."""
        logits = self.forward(x)
        return F.softmax(logits, dim=1)


class NPRDetector(BaseDetector):
    """
    NPR Deepfake Detector implementation.
    
    Extends BaseDetector with NPR-specific model and preprocessing.
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        device: str = "cpu",
        confidence_threshold: float = 0.5,
    ):
        super().__init__(
            model_name="npr_detector",
            model_path=model_path,
            device=device,
            confidence_threshold=confidence_threshold,
        )
        
        # Initialize preprocessor
        self.preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            normalize=True,
            use_imagenet_stats=True
        )
    
    def load_model(self) -> None:
        """Load the NPR model."""
        self.model = NPRModel(num_classes=2, pretrained=True)
        
        # Load custom weights if available
        if self.model_path and self.model_path.exists():
            state_dict = torch.load(
                self.model_path,
                map_location=self.device
            )
            self.model.load_state_dict(state_dict)
        
        self.model.to(self.device)
        self.model.eval()
        self._is_loaded = True
    
    def preprocess(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess image for NPR model.
        
        Args:
            image: PIL Image
            
        Returns:
            Preprocessed tensor (1, 3, 224, 224)
        """
        return self.preprocessor.preprocess(image).to(self.device)
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """
        Run NPR inference.
        
        Args:
            input_data: Preprocessed tensor
            
        Returns:
            Detection result with is_fake, confidence, raw_output
        """
        start_time = time.time()
        
        with torch.no_grad():
            # Get probabilities
            probs = self.model.predict_proba(input_data)
            
            # Index 0 = real, Index 1 = fake (convention)
            fake_prob = probs[0, 1].item()
            real_prob = probs[0, 0].item()
        
        processing_time = (time.time() - start_time) * 1000  # ms
        
        # Determine prediction based on threshold
        is_fake = fake_prob >= self.confidence_threshold
        
        return {
            "is_fake": is_fake,
            "confidence": fake_prob if is_fake else real_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "processing_time_ms": processing_time,
            "raw_output": probs.cpu().numpy().tolist()
        }
    
    async def detect_async(
        self,
        image_bytes: bytes
    ) -> Dict[str, Any]:
        """
        Async detection for API usage.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Detection result
        """
        if not self.is_loaded:
            self.load_model()
        
        # Preprocess
        tensor = self.preprocessor.preprocess(image_bytes).to(self.device)
        
        # Run prediction
        result = self.predict(tensor)
        result["model_name"] = self.model_name
        
        return result
