"""
Interview Sessions API
Mülakat oturumlarını yönetir ve Supabase'e kaydeder
"""

import logging
import sys
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Backend root dizinini path'e ekle
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from services.gemini_report import generate_interview_report
except ImportError as e:
    logger.warning(f"[Interviews] Gemini report import edilemedi: {e}")
    def generate_interview_report(transcript: str, language: str = "tr"):
        return {
            "overall_score": 0,
            "overall_comment": "[Gemini Report import hatası]",
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "key_topics": [],
            "strengths": [],
            "improvements": [],
        }

try:
    from services.supabase_client import get_supabase_client
except ImportError as e:
    logger.warning(f"[Interviews] Supabase client import edilemedi: {e}")
    get_supabase_client = None

router = APIRouter()


class CreateInterviewRequest(BaseModel):
    candidate_id: Optional[UUID] = None
    candidate_name: str
    candidate_email: Optional[str] = None
    transcript: str
    language: str = "tr"


class CreateInterviewResponse(BaseModel):
    id: str
    score_10: float
    status_label: str
    report_json: dict


def calculate_status_label(score_10: float) -> str:
    """Score'a göre status label hesapla"""
    if score_10 >= 8.0:
        return "Güçlü Aday"
    elif score_10 >= 6.0:
        return "İkinci Görüşme"
    else:
        return "Uygun Değil"


@router.post("/interviews", response_model=CreateInterviewResponse)
async def create_interview(payload: CreateInterviewRequest):
    """
    Mülakat oturumu oluştur, Gemini ile rapor üret ve Supabase'e kaydet
    
    Args:
        payload: Aday bilgileri ve transcript
    
    Returns:
        Oluşturulan interview session bilgileri
    """
    logger.info(
        "[Interviews] POST /api/v1/interviews - Yeni mülakat oturumu oluşturuluyor (candidate_name=%s, transcript_length=%d)",
        payload.candidate_name,
        len(payload.transcript) if payload.transcript else 0,
    )
    
    # Transcript kontrolü
    if not payload.transcript or len(payload.transcript.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Transcript çok kısa veya boş. Minimum 20 karakter gereklidir.",
        )
    
    try:
        # 1. Gemini ile rapor üret
        logger.info("[Interviews] Gemini raporu üretiliyor...")
        try:
            report = generate_interview_report(
                transcript=payload.transcript,
                language=payload.language or "tr",
            )
        except (ValueError, RuntimeError, ImportError) as gemini_error:
            logger.error(f"[Interviews] Gemini rapor hatası: {gemini_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Gemini rapor üretilemedi: {str(gemini_error)}",
            )
        
        # 2. overall_score'u 0-100'den 0-10'a çevir
        overall_score = report.get("overall_score", 0)
        score_10 = round(overall_score / 10.0, 1)
        score_10 = max(0.0, min(10.0, score_10))  # 0-10 arası sınırla
        
        # 3. Status label hesapla
        status_label = calculate_status_label(score_10)
        
        logger.info(
            "[Interviews] Gemini raporu üretildi: score_10=%.1f, status_label=%s, model=%s",
            score_10,
            status_label,
            "gemini-2.5-flash",
        )
        
        # 4. Supabase'e kaydet
        if get_supabase_client is None:
            logger.error("[Interviews] Supabase client kullanılamıyor")
            raise HTTPException(
                status_code=500,
                detail="Supabase client yapılandırılmamış. SUPABASE_URL ve SUPABASE_SERVICE_KEY kontrol edin.",
            )
        
        supabase = get_supabase_client()
        
        insert_data = {
            "candidate_id": str(payload.candidate_id) if payload.candidate_id else None,
            "candidate_name": payload.candidate_name,
            "candidate_email": payload.candidate_email,
            "score_10": float(score_10),
            "status_label": status_label,
            "report_json": report,
        }
        
        logger.info("[Interviews] Supabase'e kaydediliyor...")
        result = supabase.table("interview_sessions").insert(insert_data).execute()
        
        if not result.data or len(result.data) == 0:
            logger.error("[Interviews] Supabase insert başarısız - result.data boş")
            raise HTTPException(
                status_code=500,
                detail="Supabase'e kayıt başarısız oldu.",
            )
        
        created_session = result.data[0]
        session_id = created_session["id"]
        
        logger.info(
            "[Interviews] ✅ Mülakat oturumu başarıyla oluşturuldu: id=%s, score_10=%.1f, status=%s",
            session_id,
            score_10,
            status_label,
        )
        
        return CreateInterviewResponse(
            id=session_id,
            score_10=score_10,
            status_label=status_label,
            report_json=report,
        )
        
    except ValueError as e:
        logger.error(f"[Interviews] Validation hatası: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("[Interviews] Beklenmeyen hata")
        raise HTTPException(
            status_code=500,
            detail=f"Interview session oluşturulamadı: {str(e)}",
        )
