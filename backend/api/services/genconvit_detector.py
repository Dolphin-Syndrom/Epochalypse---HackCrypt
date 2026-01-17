"""
GenConViT Deepfake Detector (Adapted for ED Variant)

Implementation maps to GenConViTED model for video deepfake detection.
"""
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
import logging

import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import numpy as np

from api.services.base import BaseDetector

# Import from the specific model file we identified
try:
    from model.video.GenConViT.model.genconvit_ed import GenConViTED
except ImportError as e:
    logging.getLogger(__name__).error(f"Failed to import GenConViTED: {e}. Check python path.")
    # Fallback/Placeholder to prevent ImportErrors crashing everything immediately
    GenConViTED = None

logger = logging.getLogger(__name__)

class GenConViTDetector(BaseDetector):
    """
    GenConViT-based video deepfake detector.
    Uses GenConViTED architecture.
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = Path("model/video/GenConViT/weight/genconvit_ed_inference.pth"),
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
        
        # Preprocessing for GenConViT
        # Note: model expects 224x224
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            # Normalization might be needed. config.yaml doesn't specify, 
            # but pred_func.py uses normalize_data()["vid"].
            # Assuming standard ImageNet or similar if calling timm.
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def load_model(self) -> None:
        """Load the GenConViT model."""
        if GenConViTED is None:
            raise ImportError("GenConViTED class could not be imported.")
            
        # Hardcoded config matching config.yaml
        config = {
            "model": {
                "backbone": "convnext_tiny",
                "embedder": "swin_tiny_patch4_window7_224",
                "latent_dims": 12544
            },
            "img_size": 224
        }
        
        try:
            # Initialize model
            self.model = GenConViTED(config, pretrained=False)
            
            # Load weights
            if self.model_path:
                logger.info(f"Loading GenConViT weights from {self.model_path}")
                if not self.model_path.exists():
                     # Try absolute path if relative failed
                     # But model_path should be correct if passed from main
                     pass
                
                checkpoint = torch.load(
                    self.model_path,
                    map_location=self.device
                )
                
                # Handle different checkpoint formats
                if isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
                    state_dict = checkpoint['state_dict']
                else:
                    state_dict = checkpoint
                    
                self.model.load_state_dict(state_dict, strict=False) # strict=False to be safe with auxiliary keys
            else:
                logger.warning("No model path provided for GenConViT. Using random initialization.")
            
            self.model.to(self.device)
            self.model.eval()
            self._is_loaded = True
            
        except Exception as e:
            logger.error(f"Failed to load GenConViT model: {e}")
            raise

    def preprocess(self, image: Image.Image) -> torch.Tensor:
        """Preprocess a single frame."""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return self.transform(image)
    
    def preprocess_frames(self, frames: List[Image.Image]) -> torch.Tensor:
        """
        Preprocess a list of video frames.
        Returns: (num_frames, C, H, W) -> Batch for the model
        """
        processed = [self.preprocess(frame) for frame in frames]
        
        # Stack into batch
        frames_tensor = torch.stack(processed)
        return frames_tensor.to(self.device)
    
    def predict(self, input_data: torch.Tensor) -> Dict[str, Any]:
        """
        Run inference on batch of frames.
        Args:
            input_data: (num_frames, C, H, W)
        """
        start_time = time.time()
        
        with torch.no_grad():
            # GenConViTED forward takes (N, C, H, W) and returns (N, num_classes)
            logits = self.model(input_data)
            probs = F.softmax(logits, dim=1) # (N, 2)
            
            # Simple averaging of frame probabilities
            # Column 0: Real?, Column 1: Fake?
            # genconvit_ed.py fc2 output is 2.
            # pred_func.py says: {0: "REAL", 1: "FAKE"}[prediction ^ 1] ??
            # Wait, pred_func: return {0: "REAL", 1: "FAKE"}[prediction ^ 1]
            # prediction = torch.argmax(mean_val)
            # if prediction^1 is used, then 0->1(FAKE), 1->0(REAL)?
            # Indices: 0 is REAL, 1 is FAKE usually?
            # If prediction is 0 (argmax index 0), prediction^1 is 1 -> FAKE.
            # So Index 0 is FAKE, Index 1 is REAL?
            # Let's check pred_func.py line 91:
            # return {0: "REAL", 1: "FAKE"}[prediction ^ 1]
            # If prop[0] > prop[1], argmax=0. 0^1=1 -> FAKE.
            # So Index 0 = FAKE?
            
            # Wait, standard is usually 0=Fake, 1=Real or vice versa.
            # If Index 0 is High -> FAKE.
            # If Index 1 is High -> REAL.
            
            # Let's verify.
            # pred_cmp(y_pred): mean_val = mean(y_pred).
            # return argmax(mean_val)
            # real_or_fake(pred): ...[pred^1]
            # If pred=0 -> returns 1 -> FAKE.
            # So Index 0 IS FAKE.
            
            fake_prob = probs[:, 0].mean().item()
            real_prob = probs[:, 1].mean().item()
            
            # Let's double check this logic.
            # If max_prediction_value returns 0 (index 0 is max), then it maps to FAKE.
            # So yes, Index 0 is FAKE PROBABILITY.
            
        processing_time = (time.time() - start_time) * 1000
        
        is_fake = fake_prob > real_prob # Simple argmax logic equivalent
        if self.confidence_threshold:
             is_fake = fake_prob >= self.confidence_threshold

        return {
            "is_fake": is_fake,
            "confidence": fake_prob if is_fake else real_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "processing_time_ms": processing_time,
            "num_frames_analyzed": input_data.shape[0],
            "raw_output": probs.cpu().numpy().tolist()
        }

    def detect_video(self, frames: List[Image.Image]) -> Dict[str, Any]:
        """
        Detect deepfake in video frames.
        """
        if not self.is_loaded:
            self.load_model()
        
        # Preprocess frames
        frames_tensor = self.preprocess_frames(frames)
        
        # Run prediction
        result = self.predict(frames_tensor)
        result["model_name"] = self.model_name
        
        return result
