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

# Backend root dizinini path'e ekle (services/gemini_stt.py için)
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from services.gemini_stt import transcribe_with_gemini_chunk
except ImportError as e:
    # Fallback: Eğer import başarısız olursa dummy fonksiyon kullan
    logger.warning(f"[STT] Gemini STT import edilemedi: {e}, dummy fonksiyon kullanılıyor")
    
    async def transcribe_with_gemini_chunk(audio_bytes: bytes, suffix: str = ".webm", language: str = "tr") -> str:
        return "[Gemini STT import hatası - GEMINI_API_KEY kontrol edin]"

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
    Audio bytes'ı text'e çevir (STT) - Gemini API kullanır
    
    Args:
        data: Audio bytes (webm/opus format)
    
    Returns:
        Transcribed text (Türkçe)
    """
    try:
        # Gemini STT ile transkript et
        text = await transcribe_with_gemini_chunk(
            audio_bytes=data,
            suffix=".webm",  # MediaRecorder audio/webm gönderiyor
            language="tr",  # Türkçe
        )
        return text
    except Exception as e:
        logger.error(f"[STT] Gemini transkript hatası: {e}", exc_info=True)
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
    
    Client audio chunk'larını bu endpoint'e gönderir.
    Backend bunları STT'ye verir ve sonucu transcript client'larına broadcast eder.
    
    Query Params:
        session_id: Mülakat oturum ID'si
        role: "candidate" (Aday) veya "interviewer" (Görüşmeci)
    """
    await ws.accept()
    logger.info(f"[STT] WebSocket connected: session_id={session_id}, role={role}")
    
    audio_buffer = bytearray()
    
    # Minimum buffer boyutu - 8000 bytes (kullanıcı isteği)
    MIN_BUFFER_SIZE = 8000  # ~0.5 saniye ses (16kHz, 16-bit)
    
    chunk_count = 0
    
    try:
        while True:
            # Binary audio data al
            chunk = await ws.receive_bytes()
            chunk_count += 1
            audio_buffer.extend(chunk)
            
            logger.info(f"[STT] Chunk received: {len(chunk)} bytes, Buffer: {len(audio_buffer)} bytes (chunk #{chunk_count})")
            
            # Yeterli veri biriktiğinde transcribe et
            if len(audio_buffer) >= MIN_BUFFER_SIZE:
                buffer_size = len(audio_buffer)
                logger.info(f"[STT] Buffer yeterli ({buffer_size} bytes), Gemini STT çağrılıyor...")
                
                # Gemini STT çağır
                text = await transcribe_bytes(bytes(audio_buffer))
                
                # Buffer'ı temizle
                audio_buffer.clear()
                
                logger.info(f"[STT] Gemini result: {text!r}")
                
                # Boş olmayan text'i broadcast et
                if text and text.strip():
                    role_display = "Aday" if role == "candidate" else "Görüşmeci"
                    logger.info(f"[STT] Transcript: [{role_display}] {text}")
                    
                    # Transcript client'larına gönder
                    await broadcast_transcript(session_id, role_display, text)
                    logger.info(f"[STT] Transcript sent to client(s).")
                else:
                    logger.warning(f"[STT] Gemini boş text döndü, broadcast edilmedi")
                    
    except WebSocketDisconnect:
        logger.info(f"[STT] WebSocket disconnected: session_id={session_id}")
    except Exception as e:
        logger.exception(f"[STT] Unexpected error in STT WebSocket handler: {e}")
    finally:
        # Kalan buffer'ı işle
        if len(audio_buffer) > 0:
            logger.info(f"[STT] Processing remaining buffer: {len(audio_buffer)} bytes")
            try:
                text = await transcribe_bytes(bytes(audio_buffer))
                if text and text.strip():
                    role_display = "Aday" if role == "candidate" else "Görüşmeci"
                    logger.info(f"[STT] Final transcript: [{role_display}] {text}")
                    await broadcast_transcript(session_id, role_display, text)
                    logger.info(f"[STT] Final transcript sent to client(s).")
            except Exception as e:
                logger.exception(f"[STT] Error processing final buffer: {e}")

