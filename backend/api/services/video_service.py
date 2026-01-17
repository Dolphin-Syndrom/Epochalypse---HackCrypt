import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO
from model.video.veridis_quo_hybrid import VeridisQuoHybrid
from model.video.frequency_utils import get_frequency_features
from model.video.gradcam_utils import generate_gradcam
from api.core.config import settings

class VideoDetectionService:
    def __init__(self, model_path="backend/model/video/weights/veridis_quo.pt"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.face_detector = YOLO("backend/model/video/weights/yolov11n-face.pt")
        self.model = VeridisQuoHybrid().to(self.device)
        # self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

    async def detect(self, video_path: str):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps) # Extracts 1 frame per second
        
        results = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            if frame_count % frame_interval == 0:
                # 1. YOLOv11 Face Detection
                yolo_results = self.face_detector(frame, conf=settings.VIDEO_FACE_CONFIDENCE_THRESHOLD, verbose=False)
                
                for r in yolo_results:
                    if r.boxes.xyxy.shape[0] > 0:
                         print(f"Frame {frame_count}: Detected {r.boxes.xyxy.shape[0]} faces.")
                    else:
                         print(f"Frame {frame_count}: No faces detected.")

                    for box in r.boxes.xyxy:
                        x1, y1, x2, y2 = map(int, box)
                        
                        # 2. 20px Padding as per instructions
                        h, w, _ = frame.shape
                        px1, py1 = max(0, x1-20), max(0, y1-20)
                        px2, py2 = min(w, x2+20), min(h, y2+20)
                        
                        face_crop = frame[py1:py2, px1:px2]
                        if face_crop.size == 0: continue

                        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                        face_resized = cv2.resize(face_rgb, (224, 224))
                        
                        # 3. Feature Extraction
                        spatial_input = torch.from_numpy(face_resized).permute(2,0,1).float().unsqueeze(0).to(self.device) / 255.0
                        
                        face_gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
                        freq_tensor = get_frequency_features(face_gray) # Returns tensor 1x1024
                        if freq_tensor.dim() == 2:
                             freq_input = freq_tensor.to(self.device)
                        else:
                             freq_input = freq_tensor.unsqueeze(0).to(self.device)

                        
                        # 4. Inference & GradCAM
                        score = self.model(spatial_input, freq_input).item()
                        
                        # Save evidence if suspicious
                        heatmap_path = f"backend/static/gradcam/frame_{frame_count}.jpg"
                        # Create dir if not exists (though we made it in prev step)
                        os.makedirs("backend/static/gradcam", exist_ok=True)
                        
                        heatmap = generate_gradcam(self.model, spatial_input, face_crop, self.model.spatial_features)
                        cv2.imwrite(heatmap_path, heatmap)
                        
                        results.append({"score": score, "heatmap": heatmap_path})
            
            frame_count += 1
        
        cap.release()
        
        if not results:
            return {"verdict": "UNDETERMINED", "confidence": 0.0, "evidence": []}

        # Median Aggregation (User Requested Default)
        all_scores = [r['score'] for r in results]
        median_score = np.median(all_scores)
        
        verdict = "FAKE" if median_score > settings.VIDEO_FAKE_THRESHOLD else "REAL"
        confidence = median_score * 100
        
        print(f"Aggregation: Median Score {median_score:.4f}. Verdict: {verdict}")

        suspicious_frames = [r for r in results if r['score'] > settings.VIDEO_FAKE_THRESHOLD]
        evidence_paths = [r['heatmap'] for r in suspicious_frames][:5]

        return {
            "verdict": verdict,
            "confidence": round(confidence, 2),
            "evidence": evidence_paths
        }
