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

# Gemini model - varsayılan gemini-1.5-flash-001
GEMINI_REPORT_MODEL_NAME = os.getenv("GEMINI_REPORT_MODEL", "gemini-2.5-flash")

# Minimum transcript uzunluğu
MIN_TRANSCRIPT_LENGTH = 20  # karakter


def _configure_gemini():
    """Gemini client'ı yapılandır ve model döndür"""
    if not genai:
        raise ImportError(
            "google-generativeai paketi yüklü değil. "
            "Lütfen requirements.txt'e google-generativeai>=0.8.0 ekleyin."
        )
    
    if not GEMINI_API_KEY:
        logger.error("[Gemini Report] GEMINI_API_KEY is not set")
        raise RuntimeError("GEMINI_API_KEY not configured")
    
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("[Gemini Report] Gemini configured (model=%s)", GEMINI_REPORT_MODEL_NAME)
    return genai.GenerativeModel(GEMINI_REPORT_MODEL_NAME)


def _empty_report() -> Dict[str, Any]:
    """Güvenli varsayılan boş rapor döndür"""
    return {
        "overall_score": 0,
        "overall_comment": "",
        "sentiment": {
            "positive": 0,
            "neutral": 0,
            "negative": 0,
        },
        "key_topics": [],
        "strengths": [],
        "improvements": [],
    }


def _normalize_report(data: Dict[str, Any]) -> Dict[str, Any]:
    """Eksik alanları doldur ve tipleri normalize et."""
    base = _empty_report()
    
    try:
        base["overall_score"] = int(data.get("overall_score", 0))
        # 0-100 arası sınırla
        base["overall_score"] = max(0, min(100, base["overall_score"]))
    except Exception:
        pass
    
    base["overall_comment"] = str(data.get("overall_comment", "")).strip()
    
    sentiment = data.get("sentiment") or {}
    for key in ["positive", "neutral", "negative"]:
        try:
            base["sentiment"][key] = int(sentiment.get(key, 0))
        except Exception:
            pass
    
    # Sentiment yüzdelerini normalize et (toplam 100 olmalı)
    total = sum(base["sentiment"].values())
    if total > 0:
        # Oranları koruyarak 100'e normalize et
        base["sentiment"]["positive"] = round((base["sentiment"]["positive"] / total) * 100)
        base["sentiment"]["neutral"] = round((base["sentiment"]["neutral"] / total) * 100)
        base["sentiment"]["negative"] = 100 - base["sentiment"]["positive"] - base["sentiment"]["neutral"]
    else:
        # Eğer hiç sentiment yoksa eşit dağıt
        base["sentiment"]["positive"] = 33
        base["sentiment"]["neutral"] = 34
        base["sentiment"]["negative"] = 33
    
    for field in ["key_topics", "strengths", "improvements"]:
        items = data.get(field) or []
        if isinstance(items, list):
            base[field] = [str(x).strip() for x in items if str(x).strip()][:5]  # Max 5 items
    
    return base


def generate_interview_report(transcript: str, language: str = "tr") -> Dict[str, Any]:
    """
    Mülakat transkriptine göre rapor üretir.
    UI'daki kutulara direkt map edilebilecek bir dict döner.
    
    Raises:
        ValueError: Transcript çok kısa veya boş
        RuntimeError: Gemini API yapılandırma hatası
        ImportError: google-generativeai paketi yüklü değil
        Exception: Gemini API çağrısı veya JSON parse hatası
    """
    if not transcript or len(transcript.strip()) < MIN_TRANSCRIPT_LENGTH:
        logger.warning("[Gemini Report] Transcript too short (len=%d, min=%d)", len(transcript.strip()) if transcript else 0, MIN_TRANSCRIPT_LENGTH)
        raise ValueError(f"Transcript çok kısa. Minimum {MIN_TRANSCRIPT_LENGTH} karakter gereklidir.")
    
    try:
        model = _configure_gemini()
    except (ImportError, RuntimeError) as e:
        logger.error(f"[Gemini Report] Gemini client yapılandırma hatası: {e}")
        raise RuntimeError(f"Gemini API yapılandırma hatası: {str(e)}") from e
    
    prompt = f"""
Sen bir kıdemli teknik işe alım uzmanı gibi davranan yapay zekâsın.
Aşağıda bir iş mülakatının TÜRKÇE transkripti var. Bu transkripte göre aday için
profesyonel bir değerlendirme raporu çıkar.

ÇIKTI SADECE GEÇERLİ JSON OLMALI. Markdown, açıklama, yorum YAZMA.

JSON şeması ŞU ŞEKİLDE OLMALI:

{{
  "overall_score": <0-100 arasında tam sayı>,
  "overall_comment": "<2-3 cümlelik kısa özet>",
  "sentiment": {{
    "positive": <0-100>,
    "neutral": <0-100>,
    "negative": <0-100>
  }},
  "key_topics": ["<kısa madde>", "..."],
  "strengths": ["<kısa madde>", "..."],
  "improvements": ["<kısa madde>", "..."]
}}

Kurallar:
- Yüzdelerin toplamı yaklaşık 100 olmalı.
- Her listede en fazla 5 madde olsun.
- Dil TÜRKÇE ve profesyonel olsun (İK raporu gibi).
- Aşırı övgü ya da aşırı sert eleştiriden kaçın; dengeli ol.
- "overall_score", adayın genel performansına göre 0-100 arası bir puan olsun.

MÜLAKAT TRANSKRİPTİ:

\"\"\"{transcript}\"\"\"
"""
    
    try:
        logger.info(
            "[Gemini Report] Requesting report from Gemini (len=%d chars)",
            len(transcript),
        )
        response = model.generate_content(prompt)
        raw = response.text.strip()
        logger.info("[Gemini Report] Raw Gemini response (first 200 chars): %s", raw[:200])
        
        # Markdown code block'ları temizle
        raw = re.sub(r'```json\s*', '', raw)
        raw = re.sub(r'```\s*', '', raw)
        raw = raw.strip()
        
        # JSON object'i bul
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            data = json.loads(json_str)
            return _normalize_report(data)
        else:
            # Direkt JSON parse dene
            data = json.loads(raw)
            return _normalize_report(data)
            
    except json.JSONDecodeError as e:
        logger.exception("[Gemini Report] JSON parse error")
        logger.error("[Gemini Report] Raw response that failed to parse: %s", raw[:500])
        raise ValueError(f"Gemini'den gelen yanıt JSON formatında değil: {str(e)}") from e
    except Exception as e:
        logger.exception("[Gemini Report] Unexpected error during report generation")
        raise RuntimeError(f"Rapor üretilirken beklenmeyen hata: {str(e)}") from e

