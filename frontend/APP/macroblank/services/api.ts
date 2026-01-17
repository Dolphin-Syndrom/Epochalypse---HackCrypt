// API Configuration
export const API_BASE_URL = 'http://192.168.0.116:8000'; // Change to your local IP for device testing
// For emulator use: 'http://10.0.2.2:8000' (Android) or 'http://localhost:8000' (iOS simulator)

export const API_ENDPOINTS = {
  video: `${API_BASE_URL}/api/v1/detect/video`,
  image: `${API_BASE_URL}/api/v1/image/detect`,
  audio: `${API_BASE_URL}/api/v1/audio/detect`,
  aiGenerated: `${API_BASE_URL}/api/v1/detect/image`, // Uses EfficientNet for AI-generated detection
  health: `${API_BASE_URL}/api/v1/health`,
};

// Detection Types
export type DetectionType = 'video' | 'image' | 'audio' | 'ai-generated';

export interface DetectionResult {
  prediction: 'REAL' | 'FAKE' | 'AI-GENERATED' | 'HUMAN' | 'ERROR';
  confidence: number;
  model?: string;
  error?: string;
}

// Helper to get mime type from file extension
function getMimeType(filename: string, defaultType: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    avi: 'video/avi',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
  };
  return mimeTypes[ext || ''] || defaultType;
}

// API Functions
export async function detectVideo(uri: string, filename: string, numFrames = 15): Promise<DetectionResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename || 'video.mp4',
      type: getMimeType(filename, 'video/mp4'),
    } as any);

    const response = await fetch(`${API_ENDPOINTS.video}?num_frames=${numFrames}&model=ed`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Video detection failed');
    }

    const data = await response.json();
    const isFake = data.is_fake;
    const rawScore = data.metadata?.raw_score ?? (data.confidence / 100);
    const confidence = isFake ? rawScore * 100 : (1 - rawScore) * 100;

    return {
      prediction: isFake ? 'FAKE' : 'REAL',
      confidence,
      model: data.metadata?.model_variant || 'GenConViT-ED',
    };
  } catch (error) {
    throw error;
  }
}

export async function detectImage(uri: string, filename: string): Promise<DetectionResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename || 'image.jpg',
      type: getMimeType(filename, 'image/jpeg'),
    } as any);

    const response = await fetch(`${API_ENDPOINTS.image}?variant=vae`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Image detection failed');
    }

    const data = await response.json();
    const results = data.results;
    const isFake = results.is_fake;
    const confidence = results.confidence_percentage;

    return {
      prediction: isFake ? 'FAKE' : 'REAL',
      confidence,
      model: data.model || 'ConvNeXt-MTCNN',
    };
  } catch (error) {
    throw error;
  }
}

export async function detectAudio(uri: string, filename: string): Promise<DetectionResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename || 'audio.mp3',
      type: getMimeType(filename, 'audio/mpeg'),
    } as any);

    const response = await fetch(API_ENDPOINTS.audio, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Audio detection failed');
    }

    const data = await response.json();
    const results = data.results;
    const isFake = results.verdict?.toLowerCase().includes('spoof') || results.is_fake;
    const confidence = Math.max(results.bonafide || 0, results.spoof || 0) * 100;

    return {
      prediction: isFake ? 'FAKE' : 'REAL',
      confidence,
      model: 'Wav2Vec2-AASIST',
    };
  } catch (error) {
    throw error;
  }
}

export async function detectAIGenerated(uri: string, filename: string): Promise<DetectionResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename || 'image.jpg',
      type: getMimeType(filename, 'image/jpeg'),
    } as any);

    // Uses the EfficientNet-based detector for AI-generated image detection
    const response = await fetch(API_ENDPOINTS.aiGenerated, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'AI-generated detection failed');
    }

    const data = await response.json();
    const isFake = data.is_fake;
    const confidence = data.confidence * 100;

    return {
      prediction: isFake ? 'FAKE' : 'REAL',
      confidence,
      model: 'EfficientNet-B3',
    };
  } catch (error) {
    throw error;
  }
}
