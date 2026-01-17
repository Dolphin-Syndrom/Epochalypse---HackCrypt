# Epochalypse HackCrypt Cosmic Cypher - MacroBlank

## Project Overview

**MacroBlank** is an **Adversarial Deepfake Detection Platform** designed to detect and mitigate AI-generated synthetic media. The system leverages a microservices architecture to ensure scalability and modularity, integrating advanced deep learning models for media authenticity analysis.

### Key Components
- **Backend API**: A high-performance FastAPI service handling model inference and business logic.
- **Frontend**: A modern web interface built with Next.js for user interaction and analysis visualization.
- **Dockerized Deployment**: Fully containerized environment for consistent deployment across different platforms.

## File Structure Map

The project is organized as follows:

```
Epochalypse---HackCrypt/
├── backend/                  # Backend API Service
│   ├── api/                  # Application source code
│   │   ├── core/             # Core configurations (settings, security)
│   │   ├── routes/           # API endpoints (ai_detection, audio, auth, etc.)
│   │   ├── schemas/          # Pydantic models for validation
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Utility functions
│   │   └── main.py           # Application entry point
│   ├── config/               # Backend configuration files
│   ├── model/                # AI/ML Models
│   │   ├── audio/            # Audio detection models
│   │   ├── image/            # Image detection models
│   │   └── video/            # Video detection models
│   ├── ai_detector_backend.py # Standalone detector backend script
│   ├── Dockerfile            # Backend container definition
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Frontend Applications
│   ├── WEB/                  # Web Interface
│   │   └── macroblank/       # Next.js Web Application
│   └── APP/                  # Native Applications
│       └── macroblank/       # Mobile/Desktop App source
│
├── docs/                     # Project Documentation (Nextra)
│   ├── components/           # Documentation components
│   ├── pages/                # Documentation pages
│   ├── theme.config.tsx      # Nextra theme configuration
│   └── package.json
│
├── docker-compose.yml        # Docker Compose orchestration
└── README.md                 # Project Overview
```

## Getting Started

### Local Development Setup

#### Backend (Python)

1. Create a virtual environment in the root directory:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Run the backend locally:
   ```bash
   cd backend
   uvicorn api.main:app --reload
   ```

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Python 3.8+](https://www.python.org/) (for local backend dev)
- [Node.js 18+](https://nodejs.org/) (for local frontend dev)

### Quick Start with Docker

```bash
docker-compose up --build
```

This will start:
- Backend API at `http://localhost:8000`
- (Optional) Frontend service if enabled in compose
