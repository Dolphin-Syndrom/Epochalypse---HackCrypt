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
        
<<<<<<< HEAD
        # 1. Step: Face Extraction
        # Detect face bounding boxes and extract
        try:
            boxes, probs = self.mtcnn.detect(img_raw)
            if boxes is not None and len(boxes) > 0:
                # Get the first detected face with highest probability
                box = boxes[0].astype(int)
                # Add margin
                margin = 20
                x1, y1, x2, y2 = box
                w, h = img_raw.size
                x1 = max(0, x1 - margin)
                y1 = max(0, y1 - margin)
                x2 = min(w, x2 + margin)
                y2 = min(h, y2 + margin)
                face_img = img_raw.crop((x1, y1, x2, y2))
            else:
                # Fallback: Manual center crop if MTCNN fails
                w, h = img_raw.size
                face_img = img_raw.crop((w//4, h//4, 3*w//4, 3*h//4))
        except Exception:
            # Fallback: Manual center crop if MTCNN fails
            w, h = img_raw.size
            face_img = img_raw.crop((w//4, h//4, 3*w//4, 3*h//4))
        
        # Resize face to 224x224 for model input
        face_img = face_img.resize((224, 224), Image.LANCZOS)
        
        # 2. Step: OpenCV Enhancement (Denoise & CLAHE)
        # Convert PIL to OpenCV BGR
        open_cv_image = cv2.cvtColor(np.array(face_img), cv2.COLOR_RGB2BGR)
        
        # Remove camera sensor grain
        open_cv_image = cv2.fastNlMeansDenoisingColored(open_cv_image, None, 10, 10, 7, 21)
        
        # Normalize lighting to prevent shadow-based false positives
        lab = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2LAB)
=======
        # 1. Denoise
        img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
        
        # 2. CLAHE Lighting Normalization
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
>>>>>>> dad934de02cd4569d16d2121387b7d19dec8f4ca
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

