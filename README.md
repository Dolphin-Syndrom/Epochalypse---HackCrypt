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
│   │   ├── core/             # Core configurations (settings, security, etc.)
│   │   ├── routes/           # API endpoints (detect, upload, health, etc.)
│   │   ├── schemas/          # Pydantic models for request/response validation
│   │   ├── services/         # Business logic and model interaction services
│   │   ├── utils/            # Utility functions
│   │   └── main.py           # Application entry point
│   ├── models/               # ML Models directory (TensorFlow/PyTorch weights)
│   ├── Dockerfile            # Backend container definition
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Frontend Applications
│   ├── WEB/                  # Web Interface (Next.js)
│   │   └── macroblank/       # Main Next.js project directory
│   │       ├── app/          # App router pages and layouts
│   │       ├── public/       # Static assets
│   │       └── ...           # Next.js configs
│   └── APP/                  # (Placeholder) Mobile/Desktop Application
│
├── docs/                     # Project Documentation
│
├── docker-compose.yml        # Docker Compose orchestration file
└── README.md                 # Project Overview and Documentation
```

## Getting Started

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
