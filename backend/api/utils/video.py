"""
Video Processing Utilities

Handles video frame extraction and metadata using OpenCV.
"""
import io
import tempfile
import os
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


class VideoProcessor:
    """
    Video processing utility for deepfake detection.
    
    Extracts frames from video files at specified intervals
    for analysis by detection models.
    """
    
    # Supported video formats
    SUPPORTED_FORMATS = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    
    def __init__(self, sample_rate: int = 10):
        """
        Initialize the video processor.
        
        Args:
            sample_rate: Extract every Nth frame (default: every 10th frame)
        """
        self.sample_rate = sample_rate
        self._temp_file: Optional[str] = None
    
    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """
        Get video metadata.
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dict with fps, frame_count, duration, width, height
        """
        cap = cv2.VideoCapture(video_path)
        
        try:
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0
            
            return {
                "fps": fps,
                "frame_count": frame_count,
                "duration_seconds": duration,
                "width": width,
                "height": height,
                "resolution": f"{width}x{height}"
            }
        finally:
            cap.release()
    
    def save_temp_video(self, video_bytes: bytes) -> str:
        """
        Save video bytes to a temporary file.
        
        Args:
            video_bytes: Raw video bytes
            
        Returns:
            Path to temporary file
        """
        # Create temp file
        fd, temp_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        
        with open(temp_path, "wb") as f:
            f.write(video_bytes)
        
        self._temp_file = temp_path
        return temp_path
    
    def cleanup(self) -> None:
        """Remove temporary files."""
        if self._temp_file and os.path.exists(self._temp_file):
            os.remove(self._temp_file)
            self._temp_file = None
    
    def extract_frames(
        self,
        video_source: str | bytes,
        sample_rate: Optional[int] = None,
        max_frames: int = 30
    ) -> Tuple[List[Image.Image], Dict[str, Any]]:
        """
        Extract frames from video at specified sample rate.
        
        Args:
            video_source: Video file path or bytes
            sample_rate: Override default sample rate
            max_frames: Maximum number of frames to extract
            
        Returns:
            Tuple of (list of PIL Images, video metadata)
        """
        rate = sample_rate or self.sample_rate
        
        # Handle bytes input
        if isinstance(video_source, bytes):
            video_path = self.save_temp_video(video_source)
        else:
            video_path = video_source
        
        try:
            # Get video info
            info = self.get_video_info(video_path)
            
            # Open video
            cap = cv2.VideoCapture(video_path)
            frames: List[Image.Image] = []
            frame_indices: List[int] = []
            frame_idx = 0
            
            while cap.isOpened() and len(frames) < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Sample every Nth frame
                if frame_idx % rate == 0:
                    # Convert BGR to RGB
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    # Convert to PIL Image
                    pil_image = Image.fromarray(rgb_frame)
                    frames.append(pil_image)
                    frame_indices.append(frame_idx)
                
                frame_idx += 1
            
            cap.release()
            
            # Add extraction info to metadata
            info["frames_extracted"] = len(frames)
            info["sample_rate"] = rate
            info["frame_indices"] = frame_indices
            
            return frames, info
            
        finally:
            # Cleanup temp file if we created one
            if isinstance(video_source, bytes):
                self.cleanup()
    
    def extract_frames_with_timestamps(
        self,
        video_source: str | bytes,
        sample_rate: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract frames with timestamp information.
        
        Returns:
            List of dicts with 'frame', 'timestamp', 'frame_index'
        """
        frames, info = self.extract_frames(video_source, sample_rate)
        fps = info.get("fps", 30)
        
        result = []
        for i, (frame, idx) in enumerate(zip(frames, info.get("frame_indices", []))):
            result.append({
                "frame": frame,
                "timestamp": idx / fps if fps > 0 else 0,
                "frame_index": idx
            })
        
        return result
