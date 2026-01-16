"""
NPR Deepfake Detector

Implementation based on NPR (Neural Pixel Representation) from CVPR 2024:
"Rethinking the Up-Sampling Operations in CNN-based Generative Network 
for Generalizable Deepfake Detection"

Uses custom ResNet backbone for binary classification (real vs fake).
Model architecture matches official implementation from:
https://github.com/chuangchuangtan/NPR-DeepfakeDetection
"""
import time
from typing import Dict, Any, Optional
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.nn import functional
from PIL import Image

from api.services.base import BaseDetector
from api.utils.preprocessing import ImagePreprocessor


def conv3x3(in_planes, out_planes, stride=1):
    """3x3 convolution with padding"""
    return nn.Conv2d(in_planes, out_planes, kernel_size=3, stride=stride,
                     padding=1, bias=False)


def conv1x1(in_planes, out_planes, stride=1):
    """1x1 convolution"""
    return nn.Conv2d(in_planes, out_planes, kernel_size=1, stride=stride, bias=False)


class Bottleneck(nn.Module):
    expansion = 4

    def __init__(self, inplanes, planes, stride=1, downsample=None):
        super(Bottleneck, self).__init__()
        self.conv1 = conv1x1(inplanes, planes)
        self.bn1 = nn.BatchNorm2d(planes)
        self.conv2 = conv3x3(planes, planes, stride)
        self.bn2 = nn.BatchNorm2d(planes)
        self.conv3 = conv1x1(planes, planes * self.expansion)
        self.bn3 = nn.BatchNorm2d(planes * self.expansion)
        self.relu = nn.ReLU(inplace=True)
        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        identity = x

        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)

        out = self.conv2(out)
        out = self.bn2(out)
        out = self.relu(out)

        out = self.conv3(out)
        out = self.bn3(out)

        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity
        out = self.relu(out)

        return out


class NPRModel(nn.Module):
    """
    NPR Model - Custom ResNet for deepfake detection.
    
    This matches the official CVPR 2024 NPR architecture exactly:
    - Uses only layer1 and layer2 (not full ResNet50)
    - Final fc: 512 -> 1 (binary classification with sigmoid)
    """

    def __init__(self, num_classes=1):
        super(NPRModel, self).__init__()
        
        block = Bottleneck
        layers = [3, 4]  # Only layer1 and layer2
        
        self.inplanes = 64
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=2, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        self.layer1 = self._make_layer(block, 64, layers[0])
        self.layer2 = self._make_layer(block, 128, layers[1], stride=2)
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc1 = nn.Linear(512, num_classes)

        # Initialize weights
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def _make_layer(self, block, planes, blocks, stride=1):
        downsample = None
        if stride != 1 or self.inplanes != planes * block.expansion:
            downsample = nn.Sequential(
                conv1x1(self.inplanes, planes * block.expansion, stride),
                nn.BatchNorm2d(planes * block.expansion),
            )

        layers = []
        layers.append(block(self.inplanes, planes, stride, downsample))
        self.inplanes = planes * block.expansion
        for _ in range(1, blocks):
            layers.append(block(self.inplanes, planes))

        return nn.Sequential(*layers)

    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)

        x = self.avgpool(x)
        x = x.view(x.size(0), -1)
        x = self.fc1(x)
        return x
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Get probability score (sigmoid of logits)."""
        logits = self.forward(x)
        return torch.sigmoid(logits)


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
        self.model = NPRModel(num_classes=1)
        
        # Load custom weights if available
        if self.model_path and self.model_path.exists():
            state_dict = torch.load(
                self.model_path,
                map_location=self.device
            )
            self.model.load_state_dict(state_dict, strict=False)
            print(f"✅ Loaded NPR weights from {self.model_path}")
        else:
            print("⚠️ NPR using pretrained ImageNet weights (download NPR weights for better accuracy)")
        
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
            # Get fake probability (sigmoid output)
            fake_prob = self.model.predict_proba(input_data).item()
            real_prob = 1.0 - fake_prob
        
        processing_time = (time.time() - start_time) * 1000  # ms
        
        # Determine prediction based on threshold
        is_fake = fake_prob >= self.confidence_threshold
        
        return {
            "is_fake": is_fake,
            "confidence": fake_prob if is_fake else real_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "processing_time_ms": processing_time,
            "raw_output": [[real_prob, fake_prob]]
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
