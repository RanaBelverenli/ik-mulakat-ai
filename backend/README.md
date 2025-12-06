# AI Interview Analysis System - Backend

Backend API for the AI Interview Analysis System built with FastAPI and WebSockets.

## Features

- RESTful API endpoints
- WebSocket support for real-time communication
- WebRTC signaling
- Audio streaming and processing
- ASR (Automatic Speech Recognition) integration
- LLM-based interview analysis
- Report generation

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure your settings

3. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

