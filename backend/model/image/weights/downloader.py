import requests
import os

def download_weights(url, save_path):
    if os.path.exists(save_path):
        print(f"File already exists: {save_path}")
        return
    
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    with open(save_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)  
    print("Download complete.")

# Define paths
weights_dir = "weights"
os.makedirs(weights_dir, exist_ok=True)

# URLs from Hugging Face
urls = {
    "ed": "https://huggingface.co/Deressa/GenConViT/resolve/main/genconvit_ed_inference.pth",
    "vae": "https://huggingface.co/Deressa/GenConViT/resolve/main/genconvit_vae_inference.pth"
}

for key, url in urls.items():
    path = os.path.join(weights_dir, f"genconvit_{key}_inference.pth")
    download_weights(url, path)