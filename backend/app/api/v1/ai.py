"""
AI-powered endpoints (Question Suggestions, etc.)
"""

import logging
import sys
from pathlib import Path
from typing import List, Optional

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

