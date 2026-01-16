"""
EfficientNet Deepfake Detector with Grad-CAM Heatmap

Uses EfficientNet-B3 for binary classification with Grad-CAM
visualization of manipulated regions.

Based on: https://github.com/thourihan/DeepfakeDetection
"""
import time
import base64
import io
from typing import Dict, Any, Optional, Tuple
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image
from torchvision import transforms

from api.services.base import BaseDetector

# Lazy imports for optional dependencies
_GRADCAM_AVAILABLE = False
_EFFICIENTNET_AVAILABLE = False


def _check_gradcam():
    global _GRADCAM_AVAILABLE
    try:
        from pytorch_grad_cam import GradCAM
        from pytorch_grad_cam.utils.image import show_cam_on_image
        _GRADCAM_AVAILABLE = True
        return True
    except ImportError:
        return False


def _check_efficientnet():
    global _EFFICIENTNET_AVAILABLE
    try:
        from efficientnet_pytorch import EfficientNet
        _EFFICIENTNET_AVAILABLE = True
        return True
    except ImportError:
        try:
            import timm
            _EFFICIENTNET_AVAILABLE = True
            return True
        except ImportError:
            return False


class EfficientNetDetector(BaseDetector):
    """
    EfficientNet-B3 based deepfake detector with Grad-CAM heatmaps.
    
    Features:
    - Binary classification (real vs fake)
    - Grad-CAM visualization of manipulated regions
    - Returns heatmap as base64 PNG
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        device: str = "cpu",
        confidence_threshold: float = 0.5,
    ):
        super().__init__(
            model_name="efficientnet_detector",
            model_path=model_path,
            device=device,
            confidence_threshold=confidence_threshold,
        )
        
        self.model = None
        self.gradcam = None
        self.target_layer = None
        
        # Standard ImageNet preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # For denormalization (heatmap overlay)
        self.denorm_mean = torch.tensor([0.485, 0.456, 0.406])
        self.denorm_std = torch.tensor([0.229, 0.224, 0.225])
    
    def load_model(self) -> None:
        """Load EfficientNet-B3 model."""
        try:
            # Try efficientnet_pytorch first
            from efficientnet_pytorch import EfficientNet
            
            if self.model_path and self.model_path.exists():
                # Load from custom weights
                self.model = EfficientNet.from_name("efficientnet-b3")
                in_features = self.model._fc.in_features
                self.model._fc = nn.Linear(in_features, 2)  # 2 classes
                state_dict = torch.load(self.model_path, map_location=self.device)
                self.model.load_state_dict(state_dict, strict=False)
                print(f"✅ Loaded EfficientNet weights from {self.model_path}")
            else:
                # Use pretrained ImageNet weights
                self.model = EfficientNet.from_pretrained("efficientnet-b3")
                in_features = self.model._fc.in_features
                self.model._fc = nn.Linear(in_features, 2)
                print("⚠️ EfficientNet using pretrained ImageNet weights")
            
            # Get target layer for Grad-CAM (last conv layer)
            self.target_layer = self.model._conv_head
            
        except ImportError:
            # Fallback to timm
            import timm
            self.model = timm.create_model(
                "efficientnet_b3",
                pretrained=True,
                num_classes=2
            )
            # Find last conv layer
            for name, module in self.model.named_modules():
                if isinstance(module, nn.Conv2d):
                    self.target_layer = module
            print("⚠️ EfficientNet (timm) using pretrained weights")
        
        self.model.to(self.device)
        self.model.eval()
        
        # Initialize Grad-CAM
        self._init_gradcam()
        
        self._is_loaded = True
    
    def _init_gradcam(self) -> None:
        """Initialize Grad-CAM for heatmap generation."""
        if not _check_gradcam():
            print("⚠️ pytorch-grad-cam not installed, heatmaps disabled")
            return
        
        try:
            from pytorch_grad_cam import GradCAM
            
            if self.target_layer is not None:
                self.gradcam = GradCAM(
                    model=self.model,
                    target_layers=[self.target_layer],
                )
                print("✅ Grad-CAM initialized")
        except Exception as e:
            print(f"⚠️ Grad-CAM init failed: {e}")
    
    def preprocess(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for EfficientNet."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.transform(image)
        return tensor.unsqueeze(0).to(self.device)
    
    def _denormalize(self, tensor: torch.Tensor) -> np.ndarray:
        """Convert normalized tensor back to RGB image."""
        arr = tensor.cpu().clone()
        if arr.dim() == 4:
            arr = arr[0]
        
        # Denormalize
        mean = self.denorm_mean.view(-1, 1, 1)
        std = self.denorm_std.view(-1, 1, 1)
        arr = arr * std + mean
        arr = arr.clamp(0, 1)
        
        # Convert to HWC numpy
        rgb = arr.permute(1, 2, 0).numpy().astype(np.float32)
        return rgb
    
    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: int
    ) -> Optional[str]:
        """
        Generate Grad-CAM heatmap as base64 PNG.
        
        Args:
            input_tensor: Preprocessed image tensor
            target_class: Class to visualize (0=fake, 1=real)
            
        Returns:
            Base64 encoded PNG image or None
        """
        if self.gradcam is None:
            return None
        
        try:
            from pytorch_grad_cam.utils.image import show_cam_on_image
            from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
            
            # Generate CAM
            targets = [ClassifierOutputTarget(target_class)]
            grayscale_cam = self.gradcam(
                input_tensor=input_tensor,
                targets=targets
            )
            grayscale_cam = grayscale_cam[0, :]  # First image in batch
            
            # Get original image for overlay
            rgb_img = self._denormalize(input_tensor)
            
            # Create heatmap overlay
            visualization = show_cam_on_image(
                rgb_img,
                grayscale_cam,
                use_rgb=True
            )
            
            # Convert to base64 PNG
            pil_img = Image.fromarray(visualization)
            buffer = io.BytesIO()
            pil_img.save(buffer, format="PNG")
            buffer.seek(0)
            
            b64_data = base64.b64encode(buffer.read()).decode("utf-8")
            return f"data:image/png;base64,{b64_data}"
            
        except Exception as e:
            print(f"Heatmap generation failed: {e}")
            return None
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """
        Run inference and generate heatmap.
        
        Args:
            input_data: Preprocessed tensor (1, 3, 224, 224)
            
        Returns:
            Detection result with heatmap
        """
        start_time = time.time()
        
        with torch.no_grad():
            logits = self.model(input_data)
            probs = F.softmax(logits, dim=1)
            
            # Class 0 = fake, Class 1 = real
            fake_prob = probs[0, 0].item()
            real_prob = probs[0, 1].item()
        
        processing_time = (time.time() - start_time) * 1000
        
        # Determine prediction
        is_fake = fake_prob >= self.confidence_threshold
        
        # Generate heatmap for the detected class
        heatmap_class = 0 if is_fake else 1  # Show evidence for detected class
        heatmap_b64 = self.generate_heatmap(input_data, heatmap_class)
        
        return {
            "is_fake": is_fake,
            "confidence": fake_prob if is_fake else real_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "heatmap_base64": heatmap_b64,
            "processing_time_ms": processing_time,
        }
    
    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """
        Detect deepfake in image with heatmap.
        
        Args:
            image: PIL Image
            
        Returns:
            Detection result
        """
        if not self.is_loaded:
            self.load_model()
        
        tensor = self.preprocess(image)
        result = self.predict(tensor)
        result["model_name"] = self.model_name
        
        return result
