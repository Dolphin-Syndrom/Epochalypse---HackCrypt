"""
GenConViT Deepfake Detector

Implementation based on GenConViT (Generative Convolutional Vision Transformer)
for video deepfake detection.

Reference: "Deepfake Video Detection Using Generative Convolutional Vision Transformer"
GitHub: https://github.com/erprogs/GenConViT
"""
import time
from typing import Dict, Any, Optional, List
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

from api.services.base import BaseDetector
from api.utils.preprocessing import ImagePreprocessor


class ConvNeXtEncoder(nn.Module):
    """
    ConvNeXt-based encoder for spatial feature extraction.
    Uses pretrained ConvNeXt-Tiny as backbone.
    """
    
    def __init__(self, pretrained: bool = True):
        super().__init__()
        
        # Load pretrained ConvNeXt-Tiny
        weights = models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1 if pretrained else None
        convnext = models.convnext_tiny(weights=weights)
        
        # Remove classifier, keep feature extractor
        self.features = nn.Sequential(*list(convnext.children())[:-1])
        self.feature_dim = 768  # ConvNeXt-Tiny output dimension
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Extract spatial features."""
        features = self.features(x)
        return features.flatten(1)


class TemporalTransformer(nn.Module):
    """
    Transformer for temporal feature aggregation across frames.
    """
    
    def __init__(
        self,
        input_dim: int = 768,
        num_heads: int = 8,
        num_layers: int = 2,
        dropout: float = 0.1
    ):
        super().__init__()
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=input_dim,
            nhead=num_heads,
            dropout=dropout,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.cls_token = nn.Parameter(torch.randn(1, 1, input_dim))
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Aggregate temporal features.
        
        Args:
            x: (batch, num_frames, feature_dim)
            
        Returns:
            Aggregated feature vector (batch, feature_dim)
        """
        batch_size = x.size(0)
        
        # Add CLS token
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)
        
        # Apply transformer
        x = self.transformer(x)
        
        # Return CLS token output
        return x[:, 0]


class GenConViTModel(nn.Module):
    """
    GenConViT: Generative Convolutional Vision Transformer.
    
    Combines ConvNeXt for spatial features and Transformer for
    temporal aggregation across video frames.
    """
    
    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        
        # Spatial encoder (ConvNeXt)
        self.spatial_encoder = ConvNeXtEncoder(pretrained=pretrained)
        
        # Temporal transformer
        self.temporal_transformer = TemporalTransformer(
            input_dim=self.spatial_encoder.feature_dim,
            num_heads=8,
            num_layers=2
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.LayerNorm(self.spatial_encoder.feature_dim),
            nn.Dropout(0.5),
            nn.Linear(self.spatial_encoder.feature_dim, 256),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, frames: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for video classification.
        
        Args:
            frames: (batch, num_frames, C, H, W)
            
        Returns:
            Classification logits (batch, num_classes)
        """
        batch_size, num_frames, C, H, W = frames.shape
        
        # Extract spatial features from each frame
        frames_flat = frames.view(batch_size * num_frames, C, H, W)
        spatial_features = self.spatial_encoder(frames_flat)
        
        # Reshape to (batch, num_frames, feature_dim)
        spatial_features = spatial_features.view(batch_size, num_frames, -1)
        
        # Apply temporal transformer
        temporal_features = self.temporal_transformer(spatial_features)
        
        # Classify
        logits = self.classifier(temporal_features)
        
        return logits
    
    def predict_proba(self, frames: torch.Tensor) -> torch.Tensor:
        """Get probability scores."""
        logits = self.forward(frames)
        return F.softmax(logits, dim=1)


class GenConViTDetector(BaseDetector):
    """
    GenConViT-based video deepfake detector.
    
    Extends BaseDetector with video-specific processing.
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        device: str = "cpu",
        confidence_threshold: float = 0.5,
        num_frames: int = 15,
    ):
        super().__init__(
            model_name="genconvit_detector",
            model_path=model_path,
            device=device,
            confidence_threshold=confidence_threshold,
        )
        
        self.num_frames = num_frames
        
        # Preprocessing for video frames
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def load_model(self) -> None:
        """Load the GenConViT model."""
        self.model = GenConViTModel(num_classes=2, pretrained=True)
        
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
        """Preprocess a single frame."""
        return self.transform(image)
    
    def preprocess_frames(self, frames: List[Image.Image]) -> torch.Tensor:
        """
        Preprocess a list of video frames.
        
        Args:
            frames: List of PIL Images
            
        Returns:
            Tensor of shape (1, num_frames, C, H, W)
        """
        processed = [self.preprocess(frame) for frame in frames]
        
        # Pad or truncate to num_frames
        if len(processed) < self.num_frames:
            # Pad with last frame
            while len(processed) < self.num_frames:
                processed.append(processed[-1] if processed else torch.zeros(3, 224, 224))
        elif len(processed) > self.num_frames:
            # Sample evenly
            indices = torch.linspace(0, len(processed) - 1, self.num_frames).long()
            processed = [processed[i] for i in indices]
        
        # Stack: (num_frames, C, H, W) -> (1, num_frames, C, H, W)
        frames_tensor = torch.stack(processed).unsqueeze(0)
        return frames_tensor.to(self.device)
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """
        Run GenConViT inference on preprocessed frames.
        
        Args:
            input_data: Tensor of shape (1, num_frames, C, H, W)
            
        Returns:
            Detection result
        """
        start_time = time.time()
        
        with torch.no_grad():
            probs = self.model.predict_proba(input_data)
            fake_prob = probs[0, 1].item()
            real_prob = probs[0, 0].item()
        
        processing_time = (time.time() - start_time) * 1000
        
        is_fake = fake_prob >= self.confidence_threshold
        
        return {
            "is_fake": is_fake,
            "confidence": fake_prob if is_fake else real_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "processing_time_ms": processing_time,
            "num_frames_analyzed": input_data.shape[1],
            "raw_output": probs.cpu().numpy().tolist()
        }
    
    def detect_video(self, frames: List[Image.Image]) -> Dict[str, Any]:
        """
        Detect deepfake in video frames.
        
        Args:
            frames: List of PIL Images from video
            
        Returns:
            Detection result
        """
        if not self.is_loaded:
            self.load_model()
        
        # Preprocess frames
        frames_tensor = self.preprocess_frames(frames)
        
        # Run prediction
        result = self.predict(frames_tensor)
        result["model_name"] = self.model_name
        
        return result
