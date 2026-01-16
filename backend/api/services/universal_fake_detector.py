"""
Universal Fake Detect - CLIP-based Deepfake Detector

Uses CLIP ViT-L/14 with a trained linear classifier for 
detecting AI-generated images. Based on CVPR 2023 paper:
"Towards Universal Fake Image Detectors that Generalize Across Generative Models"

Reference: https://github.com/WisconsinAIVision/UniversalFakeDetect
"""
import time
import base64
import io
from typing import Dict, Any, Optional
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image
from torchvision import transforms

from api.services.base import BaseDetector


# CLIP normalization stats
CLIP_MEAN = (0.48145466, 0.4578275, 0.40821073)
CLIP_STD = (0.26862954, 0.26130258, 0.27577711)


class UniversalFakeDetector(BaseDetector):
    """
    Universal Fake Detect using CLIP ViT-L/14.
    
    This detector uses frozen CLIP image encoder with a trained
    linear classifier to detect AI-generated images.
    
    Features:
    - Generalizes across different generative models (GANs, Diffusion, etc.)
    - Works on images from DALL-E, Stable Diffusion, Midjourney, etc.
    - Returns confidence scores and optional attention heatmaps
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        device: str = "cpu",
        confidence_threshold: float = 0.5,
    ):
        # Default path for FC weights
        if model_path is None:
            model_path = Path(__file__).parent.parent.parent / "model" / "universal_fake_detect" / "fc_weights.pth"
        
        super().__init__(
            model_name="universal_fake_detector",
            model_path=model_path,
            device=device,
            confidence_threshold=confidence_threshold,
        )
        
        self.clip_model = None
        self.fc = None
        self.preprocess = None
        
        # CLIP preprocessing
        self.transform = transforms.Compose([
            transforms.Resize(224, interpolation=transforms.InterpolationMode.BICUBIC),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=CLIP_MEAN, std=CLIP_STD),
        ])
        
        # For denormalization (heatmap overlay)
        self.denorm_mean = torch.tensor(CLIP_MEAN)
        self.denorm_std = torch.tensor(CLIP_STD)
    
    def load_model(self) -> None:
        """Load CLIP model and FC classifier weights."""
        try:
            import clip
        except ImportError:
            # Try installing clip
            import subprocess
            subprocess.check_call(["pip", "install", "git+https://github.com/openai/CLIP.git"])
            import clip
        
        print("📦 Loading CLIP ViT-L/14 model...")
        
        # Load CLIP model
        self.clip_model, _ = clip.load("ViT-L/14", device=self.device)
        self.clip_model.eval()
        
        # Freeze CLIP parameters
        for param in self.clip_model.parameters():
            param.requires_grad = False
        
        # Create and load FC classifier
        # CLIP ViT-L/14 has 768-dim features
        self.fc = nn.Linear(768, 1)  # Binary classification with 1 output
        
        if self.model_path and self.model_path.exists():
            state_dict = torch.load(self.model_path, map_location=self.device)
            self.fc.load_state_dict(state_dict)
            print(f"✅ Loaded FC weights from {self.model_path}")
        else:
            print(f"⚠️ FC weights not found at {self.model_path}, using random weights")
        
        self.fc.to(self.device)
        self.fc.eval()
        
        self._is_loaded = True
        print("✅ Universal Fake Detector loaded successfully")
    
    def preprocess(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for CLIP."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.transform(image)
        return tensor.unsqueeze(0).to(self.device)
    
    def _denormalize(self, tensor: torch.Tensor) -> np.ndarray:
        """Convert normalized tensor back to RGB image."""
        arr = tensor.cpu().clone()
        if arr.dim() == 4:
            arr = arr[0]
        
        mean = self.denorm_mean.view(-1, 1, 1)
        std = self.denorm_std.view(-1, 1, 1)
        arr = arr * std + mean
        arr = arr.clamp(0, 1)
        
        rgb = arr.permute(1, 2, 0).numpy().astype(np.float32)
        return rgb
    
    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        is_fake: bool
    ) -> Optional[str]:
        """
        Generate attention-based heatmap as base64 PNG.
        
        Uses CLIP's attention mechanism to highlight regions
        the model focuses on for its prediction.
        """
        try:
            # Get the original image for overlay
            rgb_img = self._denormalize(input_tensor)
            
            # For ViT, we can use attention rollout or simple gradient-based attribution
            # Here we use a simplified gradient-based approach
            input_tensor.requires_grad = True
            
            with torch.enable_grad():
                features = self.clip_model.encode_image(input_tensor)
                logit = self.fc(features.float())
                
                # Backpropagate to get gradients
                logit.backward()
                
                # Get gradients w.r.t. input
                grads = input_tensor.grad.abs()
                
                # Average across channels and normalize
                heatmap = grads.mean(dim=1, keepdim=True)[0, 0]
                heatmap = heatmap.cpu().numpy()
                heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
            
            # Apply colormap
            import cv2
            heatmap_resized = cv2.resize(heatmap, (224, 224))
            heatmap_colored = cv2.applyColorMap(
                (heatmap_resized * 255).astype(np.uint8), 
                cv2.COLORMAP_JET
            )
            heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
            
            # Overlay on original image
            rgb_uint8 = (rgb_img * 255).astype(np.uint8)
            overlay = cv2.addWeighted(rgb_uint8, 0.5, heatmap_colored, 0.5, 0)
            
            # Convert to base64 PNG
            pil_img = Image.fromarray(overlay)
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
        Run inference on preprocessed image.
        
        Args:
            input_data: Preprocessed tensor (1, 3, 224, 224)
            
        Returns:
            Detection result with confidence scores
        """
        start_time = time.time()
        
        with torch.no_grad():
            # Get CLIP image features
            features = self.clip_model.encode_image(input_data)
            
            # Pass through classifier
            # Note: features are float16 from CLIP, need to convert
            logit = self.fc(features.float())
            
            # Sigmoid for probability
            # Label 0 = real, Label 1 = fake
            fake_prob = torch.sigmoid(logit).item()
            real_prob = 1.0 - fake_prob
        
        processing_time = (time.time() - start_time) * 1000
        
        # Determine prediction
        is_fake = fake_prob >= self.confidence_threshold
        
        # Generate heatmap (using gradient-based method)
        heatmap_b64 = self.generate_heatmap(input_data.clone(), is_fake)
        
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
        Detect if image is AI-generated.
        
        Args:
            image: PIL Image
            
        Returns:
            Detection result with is_fake, confidence, and heatmap
        """
        if not self.is_loaded:
            self.load_model()
        
        # Use instance method, not the transform attribute
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.transform(image)
        tensor = tensor.unsqueeze(0).to(self.device)
        
        result = self.predict(tensor)
        result["model_name"] = self.model_name
        
        return result
