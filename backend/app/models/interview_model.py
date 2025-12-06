"""
Interview data models
"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class InterviewBase(BaseModel):
    """Base interview model"""
    candidate_id: int
    job_position: str
    scheduled_at: Optional[datetime] = None


class InterviewCreate(InterviewBase):
    """Interview creation model"""
    pass


class InterviewUpdate(BaseModel):
    """Interview update model"""
    status: Optional[str] = None
    notes: Optional[str] = None


class Interview(InterviewBase):
    """Interview model"""
    id: int
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class InterviewAnalysis(BaseModel):
    """Interview analysis model"""
    interview_id: int
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    detailed_analysis: Dict
    created_at: datetime

