import torch
import librosa
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor

class AudioDeepfakeDetector:
    """
    Implements Layer 3 (Audio Deepfake Detection) using the 
    Wav2Vec2 architecture fine-tuned for deepfake classification.
    """
    def __init__(self, model_name: str = "gustking/wav2vec2-large-xlsr-deepfake-audio-classification"):
        # Explicitly setting device based on your check_env results (CPU-only)
        self.device = torch.device("cpu")
        
        try:
            # Feature extractor handles normalization and resampling logic
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
            # Classification model with a pre-trained head
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name).to(self.device)
            self.model.eval()
        except Exception as e:
            raise RuntimeError(f"Architecture Layer 3 Error: Failed to initialize Wav2Vec2: {str(e)}")

    def predict(self, audio_path: str):
        # 1. Preprocessing: Load and resample to 16kHz as required by Wav2Vec2
        try:
            # librosa handles various formats (wav, mp3, etc.)
            speech, _ = librosa.load(audio_path, sr=16000)
        except Exception as e:
            return {"error": f"Preprocessing Error: {str(e)}"}

        # 2. Tokenization: Convert raw waveform to input tensors
        inputs = self.feature_extractor(speech, sampling_rate=16000, return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # 3. Inference: Forward pass through the transformer layers
        with torch.no_grad():
            logits = self.model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)
            # Label 0: Real, Label 1: Fake based on Gustking's fine-tuning
            confidence, prediction = torch.max(probs, dim=-1)

        return {
            "verdict": "Fake" if prediction.item() == 1 else "Real",
            "confidence": float(round(confidence.item(), 4)),
            "forensic_evidence": {
                "real_probability": float(probs[0][0]),
                "fake_probability": float(probs[0][1])
            }
        }