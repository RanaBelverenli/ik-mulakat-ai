"""
AI-powered endpoints (Question Suggestions, etc.)
"""

import logging
import sys
from pathlib import Path
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Backend root dizinini path'e ekle (services/gemini_questions.py için)
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from services.gemini_questions import generate_question_suggestions
except ImportError as e:
    logger.warning(f"[AI] Gemini questions import edilemedi: {e}")
    # Fallback: dummy fonksiyon
    async def generate_question_suggestions(transcript: str, language: str = "tr") -> List[str]:
        return ["[Gemini Questions import hatası - GEMINI_API_KEY kontrol edin]"]

try:
    from services.gemini_report import generate_interview_report
except ImportError as e:
    logger.warning(f"[AI] Gemini report import edilemedi: {e}")
    # Fallback: dummy fonksiyon
    def generate_interview_report(transcript: str, language: str = "tr"):
        return {
            "overall_score": 0,
            "overall_comment": "[Gemini Report import hatası - GEMINI_API_KEY kontrol edin]",
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "key_topics": [],
            "strengths": [],
            "improvements": [],
        }

router = APIRouter()


class QuestionSuggestionsRequest(BaseModel):
    transcript: str
    language: Optional[str] = "tr"


class QuestionSuggestionsResponse(BaseModel):
    questions: List[str]


@router.post("/questions", response_model=QuestionSuggestionsResponse)
async def generate_questions(payload: QuestionSuggestionsRequest):
    """
    Aday transkriptine göre takip soruları üretir (Gemini AI)
    
    Args:
        payload: Transcript ve dil bilgisi
    
    Returns:
        Soru önerileri listesi
    """
    logger.info(
        "[AI] Soru önerisi isteği alındı (transcript_length=%d karakter, language=%s)",
        len(payload.transcript) if payload.transcript else 0,
        payload.language,
    )
    
    # Transcript boş ise boş liste döndür
    if not payload.transcript or not payload.transcript.strip():
        logger.info("[AI] Boş transcript, boş liste döndürülüyor")
        return QuestionSuggestionsResponse(questions=[])
    
    try:
        # Gemini ile soru önerileri üret
        questions = await generate_question_suggestions(
            transcript=payload.transcript,
            language=payload.language or "tr",
        )
        
        logger.info(
            "[AI] %d soru önerisi üretildi",
            len(questions),
        )
        
        return QuestionSuggestionsResponse(questions=questions)
        
    except ValueError as e:
        # GEMINI_API_KEY eksik
        logger.error(f"[AI] Gemini API yapılandırma hatası: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gemini API is not configured. Please check GEMINI_API_KEY environment variable.",
        )
    except ImportError as e:
        # google-generativeai paketi yüklü değil
        logger.error(f"[AI] Gemini paket import hatası: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gemini API package is not installed. Please install google-generativeai>=0.8.0",
        )
    except Exception as e:
        logger.exception("[AI] Soru önerisi üretme hatası")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating question suggestions: {str(e)}",
        )


# ============================================================================
# Interview Report Endpoints
# ============================================================================

class InterviewReportRequest(BaseModel):
    transcript: str
    language: Literal["tr", "en"] = "tr"


class SentimentSchema(BaseModel):
    positive: int
    neutral: int
    negative: int


class InterviewReportResponse(BaseModel):
    overall_score: int
    overall_comment: str
    sentiment: SentimentSchema
    key_topics: List[str]
    strengths: List[str]
    improvements: List[str]


@router.post("/report", response_model=InterviewReportResponse)
async def generate_report(payload: InterviewReportRequest):
    """
    Mülakat transkriptine göre detaylı rapor üretir (Gemini AI)
    
    Args:
        payload: Transcript ve dil bilgisi
    
    Returns:
        Detaylı mülakat raporu
    """
    logger.info(
        "[AI] Rapor isteği alındı (transcript_length=%d karakter, language=%s)",
        len(payload.transcript) if payload.transcript else 0,
        payload.language,
    )
    
    # Transcript boş ise boş rapor döndür
    if not payload.transcript or not payload.transcript.strip():
        logger.info("[AI] Boş transcript, boş rapor döndürülüyor")
        empty_report = {
            "overall_score": 0,
            "overall_comment": "",
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "key_topics": [],
            "strengths": [],
            "improvements": [],
        }
        return InterviewReportResponse(
            overall_score=empty_report["overall_score"],
            overall_comment=empty_report["overall_comment"],
            sentiment=SentimentSchema(**empty_report["sentiment"]),
            key_topics=empty_report["key_topics"],
            strengths=empty_report["strengths"],
            improvements=empty_report["improvements"],
        )
    
    try:
        # Gemini ile rapor üret
        report_dict = generate_interview_report(
            transcript=payload.transcript,
            language=payload.language or "tr",
        )
        
        logger.info(
            "[AI] Rapor başarıyla oluşturuldu (score=%d)",
            report_dict.get("overall_score", 0),
        )
        
        return InterviewReportResponse(
            overall_score=report_dict["overall_score"],
            overall_comment=report_dict["overall_comment"],
            sentiment=SentimentSchema(**report_dict["sentiment"]),
            key_topics=report_dict["key_topics"],
            strengths=report_dict["strengths"],
            improvements=report_dict["improvements"],
        )
        
    except ValueError as e:
        # GEMINI_API_KEY eksik
        logger.error(f"[AI] Gemini API yapılandırma hatası: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gemini API is not configured. Please check GEMINI_API_KEY environment variable.",
        )
    except ImportError as e:
        # google-generativeai paketi yüklü değil
        logger.error(f"[AI] Gemini paket import hatası: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gemini API package is not installed. Please install google-generativeai>=0.8.0",
        )
    except Exception as e:
        logger.exception("[AI] Rapor üretme hatası")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating interview report: {str(e)}",
        )

