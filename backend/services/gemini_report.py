"""
Google Gemini Interview Report Service
Mülakat transkriptine göre detaylı rapor üretir
"""

import os
import json
import re
import logging
from typing import Dict, Any, List

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    logging.warning("[Gemini Report] google-generativeai paketi bulunamadı")

logger = logging.getLogger(__name__)

# Gemini API Key - environment variable'dan al
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini model - varsayılan gemini-2.5-flash
GEMINI_REPORT_MODEL_NAME = os.getenv("GEMINI_REPORT_MODEL", "gemini-2.5-flash")

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
    logger.info(f"[Gemini Report] Gemini client yapılandırıldı (model: {GEMINI_REPORT_MODEL_NAME})")


def get_empty_report() -> Dict[str, Any]:
    """Güvenli varsayılan boş rapor döndür"""
    return {
        "overall_score": 50,
        "overall_comment": "Rapor oluşturulamadı. Lütfen tekrar deneyin.",
        "sentiment": {
            "positive": 33,
            "neutral": 34,
            "negative": 33,
        },
        "key_topics": [],
        "strengths": [],
        "improvements": [],
        "next_actions": {
            "technical_depth": [],
            "communication": [],
            "closing": [],
        },
    }


def normalize_report(report_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Rapor verilerini normalize et ve eksik alanları doldur"""
    # Overall score
    overall_score = report_dict.get("overall_score", 50)
    if not isinstance(overall_score, int):
        try:
            overall_score = int(float(overall_score))
        except (ValueError, TypeError):
            overall_score = 50
    overall_score = max(0, min(100, overall_score))  # 0-100 arası
    
    # Overall comment
    overall_comment = report_dict.get("overall_comment", "")
    if not isinstance(overall_comment, str):
        overall_comment = str(overall_comment) if overall_comment else "Değerlendirme yapılamadı."
    
    # Sentiment
    sentiment = report_dict.get("sentiment", {})
    if not isinstance(sentiment, dict):
        sentiment = {}
    
    positive = sentiment.get("positive", 33)
    neutral = sentiment.get("neutral", 34)
    negative = sentiment.get("negative", 33)
    
    # Integer'e çevir ve normalize et
    try:
        positive = int(float(positive))
        neutral = int(float(neutral))
        negative = int(float(negative))
    except (ValueError, TypeError):
        positive, neutral, negative = 33, 34, 33
    
    # Toplamı 100'e normalize et
    total = positive + neutral + negative
    if total > 0:
        positive = round((positive / total) * 100)
        neutral = round((neutral / total) * 100)
        negative = 100 - positive - neutral  # Kalanı negative'e ver
    else:
        positive, neutral, negative = 33, 34, 33
    
    # Listeleri normalize et (max 5 item)
    def normalize_list(items: Any, default: List[str] = None) -> List[str]:
        if default is None:
            default = []
        if not isinstance(items, list):
            return default
        return [str(item).strip() for item in items[:5] if item and str(item).strip()]
    
    key_topics = normalize_list(report_dict.get("key_topics", []))
    strengths = normalize_list(report_dict.get("strengths", []))
    improvements = normalize_list(report_dict.get("improvements", []))
    
    # Next actions
    next_actions = report_dict.get("next_actions", {})
    if not isinstance(next_actions, dict):
        next_actions = {}
    
    technical_depth = normalize_list(next_actions.get("technical_depth", []))
    communication = normalize_list(next_actions.get("communication", []))
    closing = normalize_list(next_actions.get("closing", []))
    
    return {
        "overall_score": overall_score,
        "overall_comment": overall_comment,
        "sentiment": {
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
        },
        "key_topics": key_topics,
        "strengths": strengths,
        "improvements": improvements,
        "next_actions": {
            "technical_depth": technical_depth,
            "communication": communication,
            "closing": closing,
        },
    }


def generate_interview_report(transcript: str, language: str = "tr") -> Dict[str, Any]:
    """
    Mülakat transkriptine göre detaylı rapor üretir
    
    Args:
        transcript: Mülakat transkripti (Türkçe)
        language: Dil kodu (varsayılan: "tr" - Türkçe)
    
    Returns:
        Rapor dictionary (normalize edilmiş)
    """
    # Transcript boş veya çok kısa ise boş rapor döndür
    if not transcript or len(transcript.strip()) < MIN_TRANSCRIPT_LENGTH:
        logger.info(
            "[Gemini Report] Transcript çok kısa (%d karakter < %d), boş rapor döndürülüyor",
            len(transcript) if transcript else 0,
            MIN_TRANSCRIPT_LENGTH,
        )
        return get_empty_report()
    
    # Gemini client'ı yapılandır
    try:
        configure_gemini_client()
    except (ImportError, ValueError) as e:
        logger.error(f"[Gemini Report] Gemini client yapılandırma hatası: {e}")
        return get_empty_report()
    
    # Prompt oluştur
    prompt = f"""Sen kıdemli bir teknik işe alım uzmanısın. Aşağıdaki mülakat transkriptini analiz edip profesyonel bir değerlendirme raporu hazırlaman gerekiyor.

Mülakat Transkripti:
{transcript}

Lütfen aşağıdaki kriterlere göre detaylı bir rapor hazırla:

1. Genel skor (0-100): Adayın genel performansını değerlendir.
2. Genel yorum (2-3 cümle): Adayın genel performansı hakkında kısa bir özet (Türkçe).
3. Duygu analizi: Pozitif, nötr ve negatif yüzdeleri (toplamı 100 olmalı).
4. Ana konular: Mülakatta konuşulan ana konular (max 5 madde, kısa).
5. Güçlü yönler: Adayın güçlü yönleri (max 5 madde, kısa).
6. Gelişim alanları: Adayın geliştirmesi gereken yönler (max 5 madde, kısa).
7. Sonraki adımlar:
   - Teknik derinlik: Teknik konularda derinleşmek için öneriler (max 5 madde).
   - İletişim: İletişim becerileri için öneriler (max 5 madde).
   - Kapanış: Mülakatı kapatmak için öneriler (max 5 madde).

Çıktı formatı: SADECE JSON, markdown yok, yorum yok. Şu formatta olmalı:
{{
  "overall_score": 75,
  "overall_comment": "Aday teknik bilgisi güçlü ve iletişim becerileri iyi. Ancak bazı konularda daha fazla deneyim gerekiyor.",
  "sentiment": {{
    "positive": 60,
    "neutral": 30,
    "negative": 10
  }},
  "key_topics": ["React", "Node.js", "Database Design"],
  "strengths": ["Güçlü teknik bilgi", "İyi iletişim"],
  "improvements": ["Daha fazla proje deneyimi", "Sistem tasarımı"],
  "next_actions": {{
    "technical_depth": ["Algoritma soruları sor", "Sistem tasarımı derinleştir"],
    "communication": ["Takım çalışması deneyimlerini sor", "Liderlik örnekleri iste"],
    "closing": ["Maaş beklentisi sor", "Başlangıç tarihi öğren"]
  }}
}}

SADECE JSON döndür, başka metin ekleme."""

    logger.info(
        "[Gemini Report] Gemini'ye rapor isteği gönderiliyor (model=%s, transcript_length=%d karakter)",
        GEMINI_REPORT_MODEL_NAME,
        len(transcript),
    )
    
    try:
        model = genai.GenerativeModel(GEMINI_REPORT_MODEL_NAME)
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        logger.debug(f"[Gemini Report] Gemini response: {response_text[:500]}...")
        
        # JSON'u bul ve parse et
        # Önce markdown code block'ları temizle
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        response_text = response_text.strip()
        
        # JSON object'i bul
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            report_dict = json.loads(json_str)
            
            # Normalize et
            normalized = normalize_report(report_dict)
            
            logger.info(
                "[Gemini Report] Rapor başarıyla oluşturuldu (score=%d, topics=%d, strengths=%d)",
                normalized["overall_score"],
                len(normalized["key_topics"]),
                len(normalized["strengths"]),
            )
            
            return normalized
        else:
            logger.warning("[Gemini Report] JSON object bulunamadı, boş rapor döndürülüyor")
            return get_empty_report()
            
    except json.JSONDecodeError as e:
        logger.exception("[Gemini Report] JSON parse hatası")
        return get_empty_report()
    except Exception as e:
        logger.exception("[Gemini Report] Gemini API çağrısı hatası")
        return get_empty_report()

