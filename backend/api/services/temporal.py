"""
Temporal Analysis Module

Analyzes consistency and temporal patterns across video frames
to detect deepfake artifacts.
"""
from typing import List, Dict, Any
import numpy as np


class TemporalAnalyzer:
    """
    Analyzes temporal consistency across video frames.
    
    Detects:
    - Prediction inconsistencies between frames
    - Sudden confidence spikes (flickering)
    - Unnatural temporal patterns
    """
    
    def __init__(
        self,
        consistency_threshold: float = 0.3,
        flicker_threshold: float = 0.4
    ):
        """
        Initialize temporal analyzer.
        
        Args:
            consistency_threshold: Max allowed variance in predictions
            flicker_threshold: Max allowed sudden change between frames
        """
        self.consistency_threshold = consistency_threshold
        self.flicker_threshold = flicker_threshold
    
    def analyze_frame_predictions(
        self,
        predictions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze per-frame predictions for temporal consistency.
        
        Args:
            predictions: List of per-frame prediction results
            
        Returns:
            Temporal analysis result
        """
        if not predictions:
            return {
                "is_consistent": True,
                "consistency_score": 1.0,
                "flicker_detected": False,
                "temporal_artifacts": []
            }
        
        # Extract confidence scores
        confidences = [p.get("fake_probability", 0.5) for p in predictions]
        is_fake_list = [p.get("is_fake", False) for p in predictions]
        
        # Calculate consistency metrics
        variance = np.var(confidences)
        mean_confidence = np.mean(confidences)
        
        # Check for flickering (sudden changes)
        flicker_points = []
        for i in range(1, len(confidences)):
            diff = abs(confidences[i] - confidences[i-1])
            if diff > self.flicker_threshold:
                flicker_points.append({
                    "frame_index": i,
                    "confidence_jump": diff,
                    "from": confidences[i-1],
                    "to": confidences[i]
                })
        
        # Check prediction consistency
        fake_ratio = sum(is_fake_list) / len(is_fake_list)
        is_consistent = variance < self.consistency_threshold
        
        # Temporal artifacts
        artifacts = []
        if variance > self.consistency_threshold:
            artifacts.append({
                "type": "high_variance",
                "description": "Inconsistent predictions across frames",
                "variance": float(variance)
            })
        
        if flicker_points:
            artifacts.append({
                "type": "flickering",
                "description": "Sudden changes in prediction confidence",
                "flicker_count": len(flicker_points),
                "flicker_points": flicker_points[:5]  # Limit to first 5
            })
        
        return {
            "is_consistent": is_consistent,
            "consistency_score": 1.0 - min(variance * 2, 1.0),
            "mean_confidence": float(mean_confidence),
            "variance": float(variance),
            "fake_frame_ratio": float(fake_ratio),
            "flicker_detected": len(flicker_points) > 0,
            "flicker_count": len(flicker_points),
            "temporal_artifacts": artifacts
        }
    
    def aggregate_predictions(
        self,
        predictions: List[Dict[str, Any]],
        temporal_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Aggregate per-frame predictions into final video prediction.
        
        Args:
            predictions: Per-frame predictions
            temporal_analysis: Result from analyze_frame_predictions
            
        Returns:
            Final aggregated prediction
        """
        if not predictions:
            return {
                "is_fake": False,
                "confidence": 0.0,
                "method": "no_frames"
            }
        
        # Weighted voting based on confidence
        fake_votes = sum(1 for p in predictions if p.get("is_fake", False))
        total_votes = len(predictions)
        
        # Mean and max confidence
        confidences = [p.get("fake_probability", 0.5) for p in predictions]
        mean_conf = np.mean(confidences)
        max_conf = np.max(confidences)
        
        # Temporal penalty for inconsistent predictions
        consistency_score = temporal_analysis.get("consistency_score", 1.0)
        
        # Final decision
        fake_ratio = fake_votes / total_votes
        
        # High flickering is suspicious (could indicate per-frame manipulation)
        flicker_bonus = 0.1 if temporal_analysis.get("flicker_detected", False) else 0
        
        # Weighted confidence
        final_confidence = (mean_conf * 0.6 + max_conf * 0.4) * consistency_score + flicker_bonus
        final_confidence = min(final_confidence, 1.0)
        
        is_fake = fake_ratio > 0.5 or final_confidence > 0.5
        
        return {
            "is_fake": is_fake,
            "confidence": float(final_confidence),
            "fake_frame_ratio": float(fake_ratio),
            "mean_frame_confidence": float(mean_conf),
            "max_frame_confidence": float(max_conf),
            "consistency_adjusted": True,
            "method": "temporal_weighted_voting"
        }
