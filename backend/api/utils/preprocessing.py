"""
Image Preprocessing Utilities

Handles image normalization, resizing, and tensor conversion
for deepfake detection models.
"""
import io
from typing import Tuple, Optional, Union
from pathlib import Path

import numpy as np
from PIL import Image
import torch
from torchvision import transforms


class ImagePreprocessor:
    """
    Image preprocessing pipeline for deepfake detection.
    
    Follows the preprocessing used by NPR and other CNN-based detectors:
    - Resize to target size (default 224x224)
    - Convert to RGB
    - Normalize using ImageNet statistics
    """
    
    # ImageNet normalization statistics
    IMAGENET_MEAN = [0.485, 0.456, 0.406]
    IMAGENET_STD = [0.229, 0.224, 0.225]
    
    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        normalize: bool = True,
        use_imagenet_stats: bool = True,
    ):
        """
        Initialize the preprocessor.
        
        Args:
            target_size: Target (width, height) for resizing
            normalize: Whether to normalize pixel values
            use_imagenet_stats: Use ImageNet mean/std for normalization
        """
        self.target_size = target_size
        self.normalize = normalize
        self.use_imagenet_stats = use_imagenet_stats
        
        # Build transform pipeline
        self._build_transforms()
    
    def _build_transforms(self) -> None:
        """Build the torchvision transform pipeline."""
        transform_list = [
            transforms.Resize(self.target_size),
            transforms.ToTensor(),
        ]
        
        if self.normalize and self.use_imagenet_stats:
            transform_list.append(
                transforms.Normalize(
                    mean=self.IMAGENET_MEAN,
                    std=self.IMAGENET_STD
                )
            )
        
        self.transform = transforms.Compose(transform_list)
    
    def load_image(
        self,
        source: Union[str, Path, bytes, Image.Image]
    ) -> Image.Image:
        """
        Load image from various sources.
        
        Args:
            source: File path, bytes, or PIL Image
            
        Returns:
            PIL Image in RGB mode
        """
        if isinstance(source, Image.Image):
            img = source
        elif isinstance(source, bytes):
            img = Image.open(io.BytesIO(source))
        elif isinstance(source, (str, Path)):
            img = Image.open(source)
        else:
            raise ValueError(f"Unsupported image source type: {type(source)}")
        
        # Convert to RGB if needed
        if img.mode != "RGB":
            img = img.convert("RGB")
        
        return img
    
    def preprocess(
        self,
        image: Union[str, Path, bytes, Image.Image]
    ) -> torch.Tensor:
        """
        Full preprocessing pipeline.
        
        Args:
            image: Image as path, bytes, or PIL Image
            
        Returns:
            Preprocessed tensor ready for model (1, C, H, W)
        """
        # Load image
        pil_image = self.load_image(image)
        
        # Apply transforms
        tensor = self.transform(pil_image)
        
        # Add batch dimension
        tensor = tensor.unsqueeze(0)
        
        return tensor
    
    def preprocess_batch(
        self,
        images: list
    ) -> torch.Tensor:
        """
        Preprocess a batch of images.
        
        Args:
            images: List of images (paths, bytes, or PIL Images)
            
        Returns:
            Batch tensor (N, C, H, W)
        """
        tensors = [self.preprocess(img).squeeze(0) for img in images]
        return torch.stack(tensors)
    
    def denormalize(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        Reverse normalization for visualization.
        
        Args:
            tensor: Normalized tensor
            
        Returns:
            Denormalized tensor
        """
        if not self.use_imagenet_stats:
            return tensor
        
        mean = torch.tensor(self.IMAGENET_MEAN).view(1, 3, 1, 1)
        std = torch.tensor(self.IMAGENET_STD).view(1, 3, 1, 1)
        
        return tensor * std + mean
    
    def to_numpy(self, tensor: torch.Tensor) -> np.ndarray:
        """Convert tensor to numpy array for visualization."""
        # Denormalize if needed
        tensor = self.denormalize(tensor)
        
        # Convert to numpy (B, C, H, W) -> (B, H, W, C)
        numpy_img = tensor.permute(0, 2, 3, 1).numpy()
        
        # Clip to valid range
        numpy_img = np.clip(numpy_img * 255, 0, 255).astype(np.uint8)
        
        return numpy_img
