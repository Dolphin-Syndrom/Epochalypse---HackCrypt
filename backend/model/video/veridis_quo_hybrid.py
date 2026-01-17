import torch
import torch.nn as nn
from torchvision import models

class VeridisQuoHybrid(nn.Module):
    def __init__(self):
        super().__init__()
        # Spatial Stream (1792 features)
        self.backbone = models.efficientnet_b4(weights='IMAGENET1K_V1')
        self.spatial_features = self.backbone.features
        
        # Frequency Stream MLP
        self.freq_mlp = nn.Sequential(
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.Linear(512, 512)
        )
        
        # Fusion Classifier (1792 + 512 = 2304)
        self.classifier = nn.Sequential(
            nn.Linear(2304, 1024),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(1024, 1),
            nn.Sigmoid()
        )

    def forward(self, x_s, x_f):
        # Spatial Pass
        s = self.spatial_features(x_s)
        s = torch.nn.functional.adaptive_avg_pool2d(s, 1).flatten(1)
        
        # Frequency Pass
        f = self.freq_mlp(x_f)
        
        # Concat & Classify
        return self.classifier(torch.cat((s, f), dim=1))
