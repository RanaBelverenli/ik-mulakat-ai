"""
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# TODO: Import routers
# from app.api.v1 import auth, candidates, interviews, signaling, audio_stream
# from app.core.config import settings

app = FastAPI(
    title="AI Interview Analysis System",
    description="Full-stack AI-powered interview analysis platform",
    version="1.0.0"
)

# CORS middleware - Tüm kaynaklardan gelen isteklere izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm origin'lere izin ver
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Tüm HTTP metodlarına izin ver
    allow_headers=["*"],  # Tüm header'lara izin ver
    expose_headers=["*"],  # Tüm header'ları expose et
)

# TODO: Include routers
# app.include_router(auth.router, prefix="/api/v1")
# app.include_router(candidates.router, prefix="/api/v1")
# app.include_router(interviews.router, prefix="/api/v1")
# app.include_router(signaling.router, prefix="/api/v1")
# app.include_router(audio_stream.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Interview Analysis System API"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

