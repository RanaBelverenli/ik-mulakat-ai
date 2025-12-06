"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Interview Analysis System"
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ASR Service
    ASR_API_KEY: Optional[str] = None
    ASR_API_URL: Optional[str] = None
    
    # LLM Service
    LLM_API_KEY: Optional[str] = None
    LLM_API_URL: Optional[str] = None
    LLM_MODEL: str = "gpt-4"
    
    # WebRTC
    STUN_SERVER: Optional[str] = None
    TURN_SERVER: Optional[str] = None
    
    # File Storage
    AUDIO_STORAGE_PATH: str = "./data/audio"
    TEMP_STORAGE_PATH: str = "./data/temp"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

