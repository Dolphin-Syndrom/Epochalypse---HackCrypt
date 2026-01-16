# Backend - MacroBlank Deepfake Detection API

FastAPI-based backend for adversarial deepfake detection.

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload
```

## Structure
- `api/` - FastAPI application
  - `routes/` - API endpoints
  - `schemas/` - Pydantic models
  - `services/` - Detection services
  - `core/` - Configuration and security
