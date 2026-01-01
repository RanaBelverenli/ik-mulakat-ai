"""
OpenAI Whisper STT (Speech-to-Text) Service
Audio chunk'larını OpenAI Whisper API ile Türkçe metne çevirir
"""

import os
import tempfile
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

# OpenAI API Key - environment variable'dan al
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Whisper model - varsayılan whisper-1
DEFAULT_WHISPER_MODEL = os.getenv("WHISPER_MODEL_NAME", "whisper-1")

# OpenAI client - global olarak bir kez oluştur
_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    """OpenAI client'ı singleton olarak döndür"""
    global _client
    
    if _client is None:
        if not OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY environment variable bulunamadı. "
                "Lütfen .env dosyasına veya Render environment variables'a ekleyin."
            )
        _client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("[Whisper STT] OpenAI client oluşturuldu")
    
    return _client


async def transcribe_with_whisper_chunk(
    audio_bytes: bytes,
    language: str = "tr",
) -> str:
    """
    Take a small audio chunk (webm/opus bytes from MediaRecorder) and return
    a short transcript text using OpenAI Whisper. On error, return "".
    
    Args:
        audio_bytes: Audio chunk bytes (MediaRecorder'dan gelen webm format)
        language: Dil kodu (varsayılan: "tr" - Türkçe)
    
    Returns:
        Transcribe edilmiş metin (boş string hata durumunda)
    """
    if not audio_bytes or len(audio_bytes) == 0:
        logger.warning("[Whisper STT] Boş audio bytes alındı")
        return ""
    
    if not OPENAI_API_KEY:
        logger.error("[Whisper STT] OPENAI_API_KEY bulunamadı")
        return ""
    
    try:
        # OpenAI client'ı al
        client = get_openai_client()
        
        # Write bytes to a temporary .webm file
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            tmp_path = tmp.name
        
        logger.debug(f"[Whisper STT] Geçici dosya oluşturuldu: {tmp_path} ({len(audio_bytes)} bytes)")
        
        # Whisper API'ye gönder
        logger.info(f"[Whisper STT] Transkript isteniyor (model: {DEFAULT_WHISPER_MODEL}, language: {language}, audio_size: {len(audio_bytes)} bytes)...")
        
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model=DEFAULT_WHISPER_MODEL,
                file=f,
                language=language,
                response_format="text",  # plain text output
            )
        
        # Sonucu al
        text = (result or "").strip()
        
        if text:
            logger.info(f"[Whisper STT] Transcript: {text}")
        else:
            logger.info("[Whisper STT] Empty transcript returned")
        
        # Geçici dosyayı sil
        try:
            os.unlink(tmp_path)
            logger.debug(f"[Whisper STT] Geçici dosya silindi: {tmp_path}")
        except Exception as e:
            logger.warning(f"[Whisper STT] Dosya silme hatası: {e}")
        
        return text
        
    except Exception as e:
        logger.exception("[Whisper STT] Error while transcribing chunk")
        return ""
    
    finally:
        # Geçici dosya hala varsa sil
        if 'tmp_path' in locals() and tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
