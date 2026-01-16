# cSpell:ignore genconvit erprogs
"""
GenConViT Video Deepfake Detection Service

Wrapper service that integrates the GenConViT model from erprogs/GenConViT
into the MacroBlank API.
"""
import os
import sys
import time
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, Union

import numpy as np
import torch
from PIL import Image

# Determine GenConViT path - works in both local and Docker environments
# In Docker: /app/model/video/GenConViT
# Local: relative to this file
if os.path.exists("/app/model/video/GenConViT"):
    GENCONVIT_PATH = Path("/app/model/video/GenConViT")
else:
    GENCONVIT_PATH = Path(__file__).parent.parent.parent / "model" / "video" / "GenConViT"

# Remove any conflicting 'model' paths and add GenConViT at the front
sys.path = [p for p in sys.path if 'model' not in p or 'GenConViT' in p]
sys.path.insert(0, str(GENCONVIT_PATH))

# Store original working directory
_original_cwd = os.getcwd()


class GenConViTService:
    """
    GenConViT Video Deepfake Detection Service.
    
    Wraps the GenConViT model for video deepfake detection.
    Supports ED (Autoencoder), VAE, or combined (GenConViT) modes.
    """
    
    def __init__(
        self,
        net: str = "ed",  # 'ed', 'vae', or 'genconvit'
        num_frames: int = 15,
        fp16: bool = False,
        device: Optional[str] = None,
    ):
        """
        Initialize GenConViT service.
        
        Args:
            net: Model variant ('ed', 'vae', or 'genconvit' for both)
            num_frames: Number of frames to extract from video
            fp16: Use half precision
            device: Compute device
        """
        self.net = net
        self.num_frames = num_frames
        self.fp16 = fp16
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        self.model = None
        self._is_loaded = False
        self._genconvit_path = GENCONVIT_PATH
        
    @property
    def is_loaded(self) -> bool:
        return self._is_loaded
    
    def load_model(self) -> None:
        """Load the GenConViT model."""
        if self._is_loaded:
            return
            
        # Change to GenConViT directory for proper weight loading
        os.chdir(self._genconvit_path)
        
        try:
            from model.config import load_config
            from model.pred_func import load_genconvit
            
            config = load_config()
            
            # Set weight names based on net type
            ed_weight = "genconvit_ed_inference" if self.net in ["ed", "genconvit"] else None
            vae_weight = "genconvit_vae_inference" if self.net in ["vae", "genconvit"] else None
            
            self.model = load_genconvit(config, self.net, ed_weight, vae_weight, self.fp16)
            self._is_loaded = True
            
            print(f"✅ GenConViT ({self.net}) loaded on {self.device}")
            
        finally:
            os.chdir(_original_cwd)
    
    def unload_model(self) -> None:
        """Unload model to free memory."""
        if self.model is not None:
            del self.model
            self.model = None
            self._is_loaded = False
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
    
    def detect_video(
        self,
        video_path: Union[str, Path],
        num_frames: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Detect deepfake in a video file.
        
        Args:
            video_path: Path to video file
            num_frames: Override default frame count
            
        Returns:
            Detection result with is_fake, confidence, etc.
        """
        if not self._is_loaded:
            self.load_model()
        
        num_frames = num_frames or self.num_frames
        video_path = str(video_path)
        
        # Change to GenConViT directory for imports
        os.chdir(self._genconvit_path)
        
        try:
            from model.pred_func import (
                df_face, 
                pred_vid, 
                real_or_fake,
                extract_frames,
                face_rec,
                preprocess_frame
            )
            
            start_time = time.time()
            
            # Extract faces from video frames
            df = df_face(video_path, num_frames)
            
            if len(df) < 1:
                return {
                    "is_fake": False,
                    "confidence": 0.0,
                    "prediction": "UNKNOWN",
                    "error": "No faces detected in video",
                    "frames_analyzed": 0,
                    "processing_time_ms": (time.time() - start_time) * 1000
                }
            
            if self.fp16:
                df = df.half()
            
            # Run prediction
            y, y_val = pred_vid(df, self.model)
            prediction = real_or_fake(y)
            
            processing_time = (time.time() - start_time) * 1000
            
            # y=0 means FAKE (inverted), y=1 means REAL
            # y_val is the confidence (closer to 0 = more fake, closer to 1 = more real)
            is_fake = prediction == "FAKE"
            confidence = (1 - y_val) if is_fake else y_val
            
            return {
                "is_fake": is_fake,
                "confidence": round(confidence * 100, 2),
                "prediction": prediction,
                "raw_score": y_val,
                "frames_analyzed": len(df),
                "processing_time_ms": round(processing_time, 2),
                "model": f"genconvit_{self.net}"
            }
            
        finally:
            os.chdir(_original_cwd)
    
    def detect_video_bytes(
        self,
        video_bytes: bytes,
        filename: str = "video.mp4",
        num_frames: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Detect deepfake from video bytes (for API uploads).
        
        Args:
            video_bytes: Raw video file bytes
            filename: Original filename for extension detection
            num_frames: Override default frame count
            
        Returns:
            Detection result
        """
        # Save to temporary file
        suffix = Path(filename).suffix or ".mp4"
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name
        
        try:
            return self.detect_video(tmp_path, num_frames)
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


# Singleton instance
_genconvit_service: Optional[GenConViTService] = None


def get_genconvit_service(
    net: str = "ed",
    num_frames: int = 15,
    fp16: bool = False
) -> GenConViTService:
    """Get or create singleton GenConViT service instance."""
    global _genconvit_service
    
    if _genconvit_service is None:
        _genconvit_service = GenConViTService(net=net, num_frames=num_frames, fp16=fp16)
    
    return _genconvit_service
