"""
STT (Speech-to-Text) and Transcript WebSocket endpoints
Canlı transkript sistemi için WebSocket endpoint'leri
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, List
import asyncio
import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

# Backend root dizinini path'e ekle (services/whisper_stt.py için)
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from services.whisper_stt import transcribe_with_whisper_chunk
except ImportError as e:
    # Fallback: Eğer import başarısız olursa dummy fonksiyon kullan
    logger.warning(f"[STT] Whisper STT import edilemedi: {e}, dummy fonksiyon kullanılıyor")
    
    async def transcribe_with_whisper_chunk(audio_bytes: bytes, language: str = "tr") -> str:
        return "[Whisper STT import hatası - OPENAI_API_KEY kontrol edin]"

router = APIRouter()

# session_id -> transcript websocket client list
transcript_clients: Dict[str, List[WebSocket]] = {}


def get_session_clients(session_id: str) -> List[WebSocket]:
    """Session'a ait transcript client'larını döndür"""
    if session_id not in transcript_clients:
        transcript_clients[session_id] = []
    return transcript_clients[session_id]


async def transcribe_bytes(data: bytes) -> str:
    """
    Audio bytes'ı text'e çevir (STT) - OpenAI Whisper API kullanır
    
    Args:
        data: Audio bytes (webm/opus format)
    
    Returns:
        Transcribed text (Türkçe)
    """
    try:
        # Whisper STT ile transkript et
        text = await transcribe_with_whisper_chunk(
            audio_bytes=data,
            language="tr",  # Türkçe
        )
        return text
    except Exception as e:
        logger.error(f"[STT] Whisper transkript hatası: {e}", exc_info=True)
        # Hata durumunda boş string döndür (sistem çalışmaya devam eder)
        return ""


async def broadcast_transcript(session_id: str, role: str, text: str):
    """
    Transcript mesajını session'daki tüm client'lara gönder
    
    Args:
        session_id: Mülakat oturum ID'si
        role: "Aday" veya "Görüşmeci"
        text: Transcribe edilmiş metin
    """
    clients = get_session_clients(session_id)
    
    if not clients:
        logger.warning(f"[STT] No transcript clients connected for session: {session_id}")
        return
    
    logger.info(f"[STT] Broadcasting transcript to {len(clients)} client(s): role={role}, text_length={len(text)}")
    
    disconnected_clients = []
    
    for client in clients:
        try:
            # Frontend'in beklediği format: { role, text }
            message = {
                "role": role,
                "text": text,
            }
            await client.send_json(message)
            logger.debug(f"[STT] Transcript sent to client: {message}")
        except Exception as e:
            logger.warning(f"[STT] Transcript gönderim hatası: {e}")
            disconnected_clients.append(client)
    
    # Bağlantısı kopan client'ları temizle
    for client in disconnected_clients:
        if client in clients:
            clients.remove(client)
            logger.info(f"[STT] Disconnected client removed from session: {session_id}")


@router.websocket("/ws/transcript")
async def transcript_ws(
    ws: WebSocket,
    session_id: str = Query(..., description="Mülakat oturum ID'si")
):
    """
    Transcript broadcast WebSocket endpoint
    
    Client'lar bu endpoint'e bağlanarak canlı transkript mesajlarını alır.
    Sadece mesaj almak için kullanılır, mesaj göndermez.
    
    Query Params:
        session_id: Mülakat oturum ID'si
    """
    await ws.accept()
    logger.info(f"[Transcript WS] Yeni client bağlandı. Session: {session_id}")
    
    clients = get_session_clients(session_id)
    clients.append(ws)
    
    try:
        # Bağlantıyı açık tut
        while True:
            # Client'tan mesaj bekleme - sadece bağlantı kontrolü
            try:
                # Ping/pong için mesaj bekle
                data = await asyncio.wait_for(ws.receive_text(), timeout=30)
                if data == "ping":
                    await ws.send_text("pong")
            except asyncio.TimeoutError:
                # Timeout olursa ping gönder
                try:
                    await ws.send_text("ping")
                except:
                    break
    except WebSocketDisconnect:
        logger.info(f"[Transcript WS] Client ayrıldı. Session: {session_id}")
    except Exception as e:
        logger.error(f"[Transcript WS] Hata: {e}")
    finally:
        if ws in clients:
            clients.remove(ws)


@router.websocket("/ws/stt")
async def stt_ws(
    ws: WebSocket,
    session_id: str = Query(..., description="Mülakat oturum ID'si"),
    role: str = Query("candidate", description="Konuşmacı rolü: candidate veya interviewer")
):
    """
    STT (Speech-to-Text) WebSocket endpoint
    
    Client her 3 saniyede bir tam WebM dosyası gönderir.
    Backend her mesajı bağımsız bir dosya olarak Whisper'a verir.
    
    Query Params:
        session_id: Mülakat oturum ID'si
        role: "candidate" (Aday) veya "interviewer" (Görüşmeci)
    """
    await ws.accept()
    logger.info("[STT] WebSocket connected: session_id=%s, role=%s", session_id, role)
    
    chunk_count = 0
    
    try:
        while True:
            # Binary audio data al - her mesaj tam bir WebM dosyası
            audio_bytes = await ws.receive_bytes()
            chunk_count += 1
            
            logger.info("[STT] Received audio chunk: %d bytes (chunk #%d)", len(audio_bytes), chunk_count)
            
            # Çok küçük chunk'ları ignore et (noise)
            if len(audio_bytes) < 2000:
                logger.debug("[STT] Chunk too small (%d bytes), skipping", len(audio_bytes))
                continue
            
            # Her mesajı bağımsız bir dosya olarak Whisper'a gönder
            transcript = await transcribe_bytes(audio_bytes)
            
            if transcript and transcript.strip():
                logger.info("[STT] Whisper result: %s", transcript)
                role_display = "Aday" if role == "candidate" else "Görüşmeci"
                logger.info("[STT] Transcript: [%s] %s", role_display, transcript)
                
                # Transcript client'larına gönder
                await broadcast_transcript(session_id, role_display, transcript)
                logger.info("[STT] Transcript sent to client(s).")
            else:
                logger.info("[STT] Empty transcript, not broadcasting")
                    
    except WebSocketDisconnect:
        logger.info("[STT] WebSocket disconnected: session_id=%s", session_id)
    except Exception:
        logger.exception("[STT] Unexpected error in STT websocket")

