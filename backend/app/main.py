"""
FastAPI application entry point
"""
import sys
import os
from pathlib import Path

# Backend dizinini Python path'e ekle (Render deployment için)
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# TODO: Import routers
# from app.api.v1 import auth, candidates, interviews, signaling, audio_stream
# from app.core.config import settings

app = FastAPI(
    title="AI Interview Analysis System",
    description="Full-stack AI-powered interview analysis platform",
    version="1.0.0"
)

logger.info("🚀 FastAPI uygulaması başlatılıyor...")
logger.info(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'development')}")

# CORS middleware - Production ve development için
import os

# Production URL'leri (Vercel)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "https://localhost:3000",
]

# Vercel URL'lerini de ekle (dinamik olarak)
if "VERCEL_URL" in os.environ:
    ALLOWED_ORIGINS.append(f"https://{os.environ['VERCEL_URL']}")

# Tüm origin'lere izin ver (development için)
# Production'da sadece belirli origin'lere izin verilebilir
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da ALLOWED_ORIGINS kullanılabilir
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "WEBSOCKET"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Import routers
from app.api.v1 import signaling, stt, ai

# Include routers
app.include_router(signaling.router, prefix="/api/v1", tags=["Signaling"])
app.include_router(stt.router, prefix="/api/v1/stt", tags=["STT"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Interview Analysis System API"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

