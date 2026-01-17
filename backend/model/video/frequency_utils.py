import numpy as np
import torch
from scipy.fftpack import dct

def get_frequency_features(img_gray):
    """Extracts combined FFT and DCT features (1024-dim vector)."""
    # 1. FFT Stream (Radial Bins)
    # Apply Hann Window to minimize edge artifacts
    h, w = img_gray.shape
    hann_y = np.hanning(h)
    hann_x = np.hanning(w)
    window_2d = np.outer(hann_y, hann_x)
    f_shift = np.fft.fftshift(np.fft.fft2(img_gray * window_2d))
    magnitude = np.log(np.abs(f_shift) + 1e-9)
    
    # Extract 8 radial frequency bands
    h, w = magnitude.shape
    y, x = np.ogrid[-h//2:h//2, -w//2:w//2]
    r = np.sqrt(x**2 + y**2).astype(int)
    fft_feat = [magnitude[r == i].mean() if (r == i).any() else 0 for i in range(8)]
    
    # 2. DCT Stream (8x8 Block-wise)
    # Most deepfake artifacts reside in specific AC frequency bands
    dct_feat = []
    for i in range(0, h, 8):
        for j in range(0, w, 8):
            block = img_gray[i:i+8, j:j+8]
            if block.shape == (8, 8):
                c = dct(dct(block.T, norm='ortho').T, norm='ortho')
                dct_feat.append(c.flatten()[1:17]) # Top 16 AC coefficients
    
    # Combine and pad/truncate to 1024 features for the model
    combined = np.concatenate([fft_feat, np.mean(dct_feat, axis=0)])
    return torch.tensor(combined, dtype=torch.float32).repeat(1, 1024 // len(combined) + 1)[:, :1024]
