"""
Analysis data models
"""
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime


class QuestionAnalysis(BaseModel):
    """Single question analysis model"""
    question: str
    answer: str
    score: float
    feedback: str
    keywords_found: List[str]


class ResponseAnalysis(BaseModel):
    """Response analysis model"""
    question_id: int
    transcription: str
    sentiment: str
    confidence: float
    analysis: QuestionAnalysis


class RealTimeAnalysis(BaseModel):
    """Real-time analysis model"""
    timestamp: datetime
    current_question: Optional[str]
    transcription: str
    sentiment: str
    confidence: float


class FinalAnalysis(BaseModel):
    """Final interview analysis model"""
    interview_id: int
    total_questions: int
    average_score: float
    responses: List[ResponseAnalysis]
    summary: str
    recommendations: List[str]
    generated_at: datetime

