import torch
import torch.nn as nn
import timm
import cv2
import numpy as np
from PIL import Image
from torchvision import transforms

class ImageDeepfakeDetector:
    def __init__(self, variant="vae"):
        self.device = torch.device("cpu")
        try:
            self.model = timm.create_model('convnext_tiny', pretrained=False, num_classes=2)
            weights_path = f"model/image/weights/genconvit_{variant}_inference.pth"
            state_dict = torch.load(weights_path, map_location=self.device)
            
            # Filter mismatched layers
            filtered_dict = {k: v for k, v in state_dict.items() if 'fc' not in k}
            self.model.load_state_dict(filtered_dict, strict=False)
            self.model.to(self.device).eval()
            
            # Standard normalization
            self.transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
            print(f"Layer 2: Architecture synced and {variant.upper()} weights loaded.")
        except Exception as e:
            raise RuntimeError(f"Sync Error: {str(e)}")

    def _apply_forensic_filters(self, image_path):
        """Standard OpenCV pipeline without face extraction."""
        img = cv2.imread(image_path)
        if img is None: return None
        
        # 1. Denoise
        img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
        
        # 2. CLAHE Lighting Normalization
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        lab[:,:,0] = clahe.apply(lab[:,:,0])
        img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        # 3. Quality Resize
        img = cv2.resize(img, (224, 224), interpolation=cv2.INTER_LANCZOS4)
        return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    def predict(self, image_path: str):
        try:
            processed_img = self._apply_forensic_filters(image_path)
            if processed_img is None:
                return {"error": "Could not process image."}
            
            img_tensor = self.transform(processed_img).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                logits = self.model(img_tensor)
                probs = torch.softmax(logits, dim=-1)
                conf, pred = torch.max(probs, dim=-1)

            confidence = float(conf.item())
            verdict = "Fake" if pred.item() == 1 else "Real"
            
            # Thresholding for reliability
            if confidence < 0.75:
                verdict = f"SUSPECTED ({verdict})"

            return {
                "verdict": verdict,
                "confidence": round(confidence, 4),
                "probabilities": {"real": float(probs[0][0]), "fake": float(probs[0][1])}
            }
        except Exception as e:
            return {"error": str(e)}

