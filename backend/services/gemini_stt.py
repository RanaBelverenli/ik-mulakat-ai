"""
Google Gemini STT (Speech-to-Text) Service
Audio chunk'larını Gemini API ile Türkçe metne çevirir
"""

import os
import tempfile
import logging
from typing import Optional
from google import genai

logger = logging.getLogger(__name__)

# Gemini API Key - environment variable'dan al
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Gemini model - ses transkripsiyonu için
GEMINI_MODEL = "gemini-2.0-flash-exp"  # veya "gemini-2.0-flash"

# Gemini client - global olarak bir kez oluştur
_client: Optional[genai.Client] = None


def get_gemini_client() -> genai.Client:
    """Gemini client'ı singleton olarak döndür"""
    global _client
    
    if _client is None:
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY environment variable bulunamadı. "
                "Lütfen .env dosyasına veya Render environment variables'a ekleyin."
            )
        _client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("[Gemini STT] Client oluşturuldu")
    
    return _client


async def transcribe_with_gemini_chunk(
    audio_bytes: bytes,
    suffix: str = ".webm",
    language: str = "tr",  # Türkçe için "tr"
) -> str:
    """
    Kısa bir ses segmentini Gemini ile Türkçe metne çevirir.
    
    Args:
        audio_bytes: Audio chunk bytes (MediaRecorder'dan gelen)
        suffix: Dosya uzantısı (.webm, .wav, .mp3, vs.)
        language: Dil kodu (varsayılan: "tr" - Türkçe)
    
    Returns:
        Transcribe edilmiş metin (boş string hata durumunda)
    """
    if not audio_bytes or len(audio_bytes) == 0:
        logger.warning("[Gemini STT] Boş audio bytes alındı")
        return ""
    
    if not GEMINI_API_KEY:
        logger.error("[Gemini STT] GEMINI_API_KEY bulunamadı")
        return ""
    
    tmp_path = None
    
    try:
        # 1) Gelen chunk'ı geçici bir dosyaya yaz
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            tmp_path = tmp.name
        
        logger.debug(f"[Gemini STT] Geçici dosya oluşturuldu: {tmp_path} ({len(audio_bytes)} bytes)")
        
        # 2) Gemini client'ı al
        client = get_gemini_client()
        
        # 3) Dosyayı Gemini Files API ile yükle
        logger.debug("[Gemini STT] Dosya Gemini'ye yükleniyor...")
        myfile = client.files.upload(path=tmp_path)
        logger.debug(f"[Gemini STT] Dosya yüklendi. File URI: {myfile.uri}")
        
        # 4) Gemini'den transkript iste
        prompt = (
            "Bu ses kaydındaki Türkçe konuşmayı **sadece ham metin** olarak yaz. "
            "Noktalama işaretleri ekle ama ek açıklama, çeviri veya özet verme. "
            "Eğer konuşma yoksa veya anlaşılmıyorsa boş string döndür."
        )
        
        logger.debug(f"[Gemini STT] Transkript isteniyor (model: {GEMINI_MODEL})...")
        result = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                myfile,
                prompt,
            ],
        )
        
        # 5) Sonucu al ve temizle
        text = (result.text or "").strip()
        
        logger.info(f"[Gemini STT] Transkript alındı: {len(text)} karakter")
        if text:
            logger.debug(f"[Gemini STT] Metin: {text[:100]}...")  # İlk 100 karakter
        
        # 6) Dosyayı Gemini'den sil (opsiyonel - storage tasarrufu için)
        try:
            client.files.delete(name=myfile.name)
            logger.debug("[Gemini STT] Geçici dosya Gemini'den silindi")
        except Exception as e:
            logger.warning(f"[Gemini STT] Dosya silme hatası (önemli değil): {e}")
        
        return text
        
    except Exception as e:
        logger.error(f"[Gemini STT] Transkript hatası: {e}", exc_info=True)
        return ""
    
    finally:
        # 7) Lokal geçici dosyayı sil
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.debug(f"[Gemini STT] Lokal geçici dosya silindi: {tmp_path}")
            except Exception as e:
                logger.warning(f"[Gemini STT] Lokal dosya silme hatası: {e}")


# Synchronous wrapper (async fonksiyon çağrılamazsa)
def transcribe_with_gemini_chunk_sync(
    audio_bytes: bytes,
    suffix: str = ".webm",
    language: str = "tr",
) -> str:
    """
    Synchronous wrapper - asyncio olmadan kullanım için
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(
        transcribe_with_gemini_chunk(audio_bytes, suffix, language)
    )

