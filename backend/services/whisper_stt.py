"""
OpenAI Whisper STT (Speech-to-Text) Service
Audio chunk'larını OpenAI Whisper API ile Türkçe metne çevirir
"""

import os
import logging
from io import BytesIO
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
        
        # BytesIO kullanarak in-memory file object oluştur
        file_obj = BytesIO(audio_bytes)
        file_obj.name = "chunk.webm"  # IMPORTANT: valid audio extension for Whisper
        
        logger.debug(f"[Whisper STT] BytesIO oluşturuldu: {len(audio_bytes)} bytes")
        
        # Whisper API'ye gönder
        logger.info(
            "[Whisper STT] Transkript isteniyor (model=%s, language=%s, audio_size=%d bytes)...",
            DEFAULT_WHISPER_MODEL,
            language,
            len(audio_bytes)
        )
        
        result = client.audio.transcriptions.create(
            model=DEFAULT_WHISPER_MODEL,
            file=file_obj,
            language=language,
            response_format="text",  # plain text output
        )
        
        # Sonucu al - response_format="text" olduğu için result direkt string
        transcript_text = result if isinstance(result, str) else getattr(result, "text", "")
        transcript_text = (transcript_text or "").strip()
        
        if transcript_text:
            logger.info("[Whisper STT] Transcript: %s", transcript_text)
        else:
            logger.info("[Whisper STT] Empty transcript returned")
        
        return transcript_text
        
    except Exception:
        logger.exception("[Whisper STT] Error while transcribing chunk")
        return ""
