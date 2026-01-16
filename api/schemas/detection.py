"""
Detection Schemas - Pydantic models for deepfake detection API.

Inspired by DeepSafe's modular detection architecture.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from enum import Enum
from datetime import datetime


class MediaType(str, Enum):
    """Supported media types for detection."""
    IMAGE = "image"
    VIDEO = "video"


class DetectionRequest(BaseModel):
    """Request model for detection operations."""
    media_type: MediaType = Field(
        default=MediaType.IMAGE,
        description="Type of media to analyze"
    )
    confidence_threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold for detection"
    )
    sample_rate: Optional[int] = Field(
        default=10,
        ge=1,
        le=60,
        description="Frame sample rate for video analysis"
    )
    use_ensemble: bool = Field(
        default=True,
        description="Whether to use ensemble of multiple detectors"
    )


class ModelScore(BaseModel):
    """Individual model prediction score."""
    model_config = {"protected_namespaces": ()}
    
    model_name: str = Field(..., description="Name of the detection model")
    score: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    is_fake: bool = Field(..., description="Whether model predicts fake")
    processing_time_ms: Optional[float] = Field(
        default=None,
        description="Model inference time in milliseconds"
    )


class DetectionResponse(BaseModel):
    """Response model for single file detection."""
    model_config = {"protected_namespaces": ()}
    
    is_fake: bool = Field(..., description="Final ensemble prediction")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Ensemble confidence score"
    )
    model_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Individual model scores"
    )
    detailed_scores: Optional[List[ModelScore]] = Field(
        default=None,
        description="Detailed per-model predictions"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the analysis"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Analysis timestamp"
    )


class BatchResultItem(BaseModel):
    """Single result in a batch detection response."""
    filename: str
    is_fake: bool
    confidence: float
    error: Optional[str] = None


class BatchDetectionResponse(BaseModel):
    """Response model for batch detection operations."""
    total_files: int = Field(..., description="Total files processed")
    fake_count: int = Field(default=0, description="Number of files detected as fake")
    real_count: int = Field(default=0, description="Number of files detected as real")
    error_count: int = Field(default=0, description="Number of files with errors")
    results: List[BatchResultItem] = Field(
        default_factory=list,
        description="Individual file results"
    )
    processing_time_ms: Optional[float] = Field(
        default=None,
        description="Total batch processing time"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Batch analysis timestamp"
    )
