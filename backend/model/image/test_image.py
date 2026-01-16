import sys
import os
from pathlib import Path

# 1. ROBUST PATH SETUP
current_file = Path(__file__).resolve()
backend_root = None

for parent in current_file.parents:
    if (parent / "model").is_dir() and (parent / "api").is_dir():
        backend_root = parent
        break

if not backend_root:
    print("Critical Error: Could not find 'backend' root directory.")
    sys.exit(1)

sys.path.insert(0, str(backend_root))
os.chdir(backend_root)

# 2. IMPORTS
from model.image.detector import ImageDeepfakeDetector

def run_batch_test():
    print(f"--- Veritas Layer 2: Batch Analysis Mode ---")
    
    try:
        detector = ImageDeepfakeDetector(variant="vae")
    except Exception as e:
        print(f"Initialization Failed: {e}")
        return

    # 3. SCAN FOLDER
    # Targeting the folder shown in your project structure
    image_folder = Path("model/image/sample_folder") 
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    
    test_files = []
    for ext in extensions:
        test_files.extend(list(image_folder.glob(ext)))

    if not test_files:
        print(f"No images found in {image_folder.absolute()}")
        return

    print(f"Found {len(test_files)} images. Starting inference...\n")

    # 4. PROCESS AND REPORT
    # Table Header
    print(f"{'FILENAME':<25} | {'VERDICT':<10} | {'CONFIDENCE':<10} | {'STATUS':<10} | {'FAKE PROB'}")
    print("-" * 80)

    results = []
    for img_path in sorted(test_files):
        result = detector.predict(str(img_path))
        
        filename = img_path.name
        verdict = result.get("verdict", "ERROR")
        confidence_val = result.get("confidence", 0)
        confidence_str = f"{confidence_val*100:.2f}%"
        fake_prob = f"{result.get('probabilities', {}).get('fake', 0):.4f}"
        
        # UPGRADE: Forensic Status
        status = "RELIABLE" if confidence_val >= 0.75 else "LOW_CONF"
        
        print(f"{filename:<25} | {verdict:<10} | {confidence_str:<10} | {status:<10} | {fake_prob}")
        results.append(result)

    print("-" * 80)
    print(f"Batch Analysis Complete. Total Scanned: {len(test_files)}")

if __name__ == "__main__":
    run_batch_test()