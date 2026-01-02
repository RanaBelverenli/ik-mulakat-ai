"""
OpenAI Whisper STT (Speech-to-Text) Service
Audio chunk'larını OpenAI Whisper API ile Türkçe metne çevirir
"""

import os
import logging
from io import BytesIO
from openai import OpenAI, BadRequestError

logger = logging.getLogger(__name__)

# OpenAI API Key - environment variable'dan al
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Whisper model - varsayılan whisper-1
DEFAULT_WHISPER_MODEL = os.getenv("WHISPER_MODEL_NAME", "whisper-1")

# OpenAI client - global olarak bir kez oluştur
_client: OpenAI | None = None

# BadRequestError loglama kontrolü (noisy log önleme)
_bad_request_logged = False


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
    Transcribe a single buffered audio chunk with OpenAI Whisper.
    
    - audio_bytes is raw audio from MediaRecorder (audio/webm;codecs=opus)
    - We wrap it in a BytesIO and set .name so the SDK can detect the format
    
    Args:
        audio_bytes: Audio chunk bytes (MediaRecorder'dan gelen webm format)
        language: Dil kodu (varsayılan: "tr" - Türkçe)
    
    Returns:
        Transcribe edilmiş metin (boş string hata durumunda)
    """
    if not audio_bytes:
        logger.warning("[Whisper STT] Empty audio_bytes received")
        return ""
    
    if not OPENAI_API_KEY:
        logger.error("[Whisper STT] OPENAI_API_KEY bulunamadı")
        return ""
    
    # Reuse existing helper to get the OpenAI client
    client = get_openai_client()
    
    logger.info(
        "[Whisper STT] Transkript isteniyor (model=%s, language=%s, audio_size=%d bytes)...",
        DEFAULT_WHISPER_MODEL,
        language,
        len(audio_bytes),
    )
    
    try:
        # Wrap bytes in an in-memory file-like object
        audio_file = BytesIO(audio_bytes)
        # Important: give it a proper name with a supported extension
        audio_file.name = "chunk.webm"
        # Make sure the file pointer is at the beginning
        audio_file.seek(0)
        
        result = client.audio.transcriptions.create(
            model=DEFAULT_WHISPER_MODEL,
            file=audio_file,
            language=language,
        )
        
        # New OpenAI Python SDK returns .text on the result
        transcript_text = (getattr(result, "text", "") or "").strip()
        logger.info("[Whisper STT] Transcript: %s", transcript_text)
        
        return transcript_text
        
    except BadRequestError as e:
        # Extra logging to debug format issues - sadece bir kez logla (noisy log önleme)
        global _bad_request_logged
        if not _bad_request_logged:
            sample_hex = audio_bytes[:32].hex()
            logger.error(
                "[Whisper STT] BadRequestError: %s | first_bytes_hex=%s",
                str(e),
                sample_hex,
            )
            logger.exception("[Whisper STT] BadRequestError details")
            _bad_request_logged = True
        return ""
    except Exception:
        logger.exception("[Whisper STT] Error while transcribing chunk")
        return ""
