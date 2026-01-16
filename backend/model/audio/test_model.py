import os
import glob
from model.audio.detector import AudioDeepfakeDetector

def run_batch_test():
    # Initialize Layer 3
    print("--- Initializing Veritas Layer 3 (Audio Detection) ---")
    detector = AudioDeepfakeDetector()
    
    # Target directory for the TTSV2V dataset files
    audio_dir = "model/audio/sample"
    # Filter for all .wav files in the directory
    test_files = glob.glob(os.path.join(audio_dir, "*.wav"))
    
    # Track metrics for the Decision Engine (Layer 5)
    results_summary = []
    print(f"Found {len(test_files)} files for analysis.\n")

    for file_path in sorted(test_files):
        filename = os.path.basename(file_path)
        print(f"Analyzing: {filename}...")
        
        result = detector.predict(file_path)
        
        # Capture evidence for consolidated reporting
        entry = {
            "filename": filename,
            "verdict": result.get("verdict"),
            "confidence": result.get("confidence"),
            "fake_prob": result.get("forensic_evidence", {}).get("fake_probability", 0)
        }
        results_summary.append(entry)
        
        print(f"  > Verdict: {entry['verdict']} ({entry['confidence']*100:.2f}%)")

    # Final Aggregated Report
    print("\n" + "="*40)
    print("VERITAS BATCH FORENSIC REPORT")
    print("="*40)
    for res in results_summary:
        print(f"FILE: {res['filename']} | {res['verdict']} | Confidence: {res['confidence']}")

if __name__ == "__main__":
    run_batch_test()