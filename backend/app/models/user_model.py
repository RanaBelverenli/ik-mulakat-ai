"""
User data models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """User creation model"""
    password: str


class UserUpdate(BaseModel):
    """User update model"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class User(UserBase):
    """User model"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CandidateBase(BaseModel):
    """Base candidate model"""
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class CandidateCreate(CandidateBase):
    """Candidate creation model"""
    resume_url: Optional[str] = None


class Candidate(CandidateBase):
    """Candidate model"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

