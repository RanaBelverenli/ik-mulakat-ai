"""
Google Gemini Question Suggestions Service
Aday transkriptine göre takip soruları üretir
"""

import os
import json
import re
import logging
from typing import List

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    logging.warning("[Gemini Questions] google-generativeai paketi bulunamadı")

logger = logging.getLogger(__name__)

# Gemini API Key - environment variable'dan al
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini model - varsayılan gemini-1.5-flash
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

# Minimum transcript uzunluğu
MIN_TRANSCRIPT_LENGTH = 50  # karakter


def configure_gemini_client():
    """Gemini client'ı yapılandır"""
    if not genai:
        raise ImportError(
            "google-generativeai paketi yüklü değil. "
            "Lütfen requirements.txt'e google-generativeai>=0.8.0 ekleyin."
        )
    
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY environment variable bulunamadı. "
            "Lütfen .env dosyasına veya Render environment variables'a ekleyin."
        )
    
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info(f"[Gemini Questions] Gemini client yapılandırıldı (model: {GEMINI_MODEL_NAME})")


async def generate_question_suggestions(transcript: str, language: str = "tr") -> List[str]:
    """
    Aday transkriptine göre takip soruları üretir
    
    Args:
        transcript: Adayın verdiği cevapların transkripti
        language: Dil kodu (varsayılan: "tr" - Türkçe)
    
    Returns:
        Takip soruları listesi (Türkçe)
    """
    # Transcript boş veya çok kısa ise boş liste döndür
    if not transcript or len(transcript.strip()) < MIN_TRANSCRIPT_LENGTH:
        logger.info(
            "[Gemini Questions] Transcript çok kısa (%d karakter < %d), boş liste döndürülüyor",
            len(transcript) if transcript else 0,
            MIN_TRANSCRIPT_LENGTH,
        )
        return []
    
    # Gemini client'ı yapılandır
    try:
        configure_gemini_client()
    except (ImportError, ValueError) as e:
        logger.error(f"[Gemini Questions] Gemini client yapılandırma hatası: {e}")
        raise
    
    # Prompt oluştur
    prompt = f"""Sen bir mülakat asistanısın. Adayın verdiği cevaplara göre takip soruları üretmen gerekiyor.

Adayın cevapları:
{transcript}

Lütfen aşağıdaki kriterlere göre 3-5 takip sorusu üret:

1. Sorular Türkçe olmalı.
2. Adayın verdiği cevaplara özel ve derinlemesine olmalı.
3. "Kendinizden bahseder misiniz?" gibi genel sorulardan kaçınılmalı (eğer transkript zaten bunu kapsıyorsa).
4. Teknik derinlik, iletişim becerisi ve problem çözme yeteneği üzerine odaklanılmalı.
5. Adayın bahsettiği konulara göre özelleştirilmiş sorular olmalı.

Çıktı formatı: Sadece bir JSON array, başka metin yok. Örnek:
["Soru 1 burada", "Soru 2 burada", "Soru 3 burada"]

Sadece JSON array'i döndür, başka açıklama yapma."""

    logger.info(
        "[Gemini Questions] Gemini'ye soru önerisi isteniyor (model=%s, transcript_length=%d karakter)",
        GEMINI_MODEL_NAME,
        len(transcript),
    )
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        logger.debug(f"[Gemini Questions] Gemini response: {response_text[:200]}...")
        
        # JSON array'i bul (regex ile)
        json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            questions = json.loads(json_str)
            
            # Her soruyu temizle ve string'e çevir
            questions = [str(q).strip() for q in questions if q and str(q).strip()]
            
            # Maksimum 5 soru
            questions = questions[:5]
            
            logger.info(
                "[Gemini Questions] %d soru üretildi: %s",
                len(questions),
                ", ".join(questions[:2]) + ("..." if len(questions) > 2 else ""),
            )
            
            return questions
        else:
            # JSON bulunamadı, fallback: newline ile split et
            logger.warning("[Gemini Questions] JSON array bulunamadı, fallback parsing kullanılıyor")
            lines = response_text.split("\n")
            questions = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Bullet karakterlerini temizle (-, •, *, vb.)
                line = re.sub(r'^[-•*]\s*', '', line)
                line = re.sub(r'^\d+\.\s*', '', line)  # Numaralandırmayı temizle
                
                if line and len(line) > 10:  # En az 10 karakter
                    questions.append(line)
            
            questions = questions[:5]  # Maksimum 5 soru
            
            logger.info(
                "[Gemini Questions] Fallback parsing ile %d soru üretildi",
                len(questions),
            )
            
            return questions
            
    except json.JSONDecodeError as e:
        logger.exception("[Gemini Questions] JSON parse hatası")
        return []
    except Exception as e:
        logger.exception("[Gemini Questions] Gemini API çağrısı hatası")
        return []

