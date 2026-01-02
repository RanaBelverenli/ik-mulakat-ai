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

# Session bazlı STT buffer state
SESSION_BUFFERS: Dict[str, bytearray] = {}  # raw audio bytes per session
SESSION_LAST_TEXT: Dict[str, str] = {}  # last full transcript returned by Whisper
SESSION_LAST_PROCESSED_SIZE: Dict[str, int] = {}  # last buffer length for which we called Whisper

# Threshold'lar
MIN_FIRST_STT_BYTES = 40000  # don't call Whisper before buffer >= 40 KB
MIN_DELTA_BYTES = 20000  # call Whisper again only if buffer increased by at least 20 KB


def get_session_clients(session_id: str) -> List[WebSocket]:
    """Session'a ait transcript client'larını döndür"""
    if session_id not in transcript_clients:
        transcript_clients[session_id] = []
    return transcript_clients[session_id]


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
    
    Client her 3 saniyede bir WebM chunk gönderir.
    Backend session bazlı buffer'da biriktirir ve tam dosyayı Whisper'a verir.
    
    Query Params:
        session_id: Mülakat oturum ID'si
        role: "candidate" (Aday) veya "interviewer" (Görüşmeci)
    """
    await ws.accept()
    logger.info("[STT] WebSocket connected: session_id=%s, role=%s", session_id, role)
    
    chunk_count = 0
    
    try:
        while True:
            # Binary audio data al
            audio_bytes = await ws.receive_bytes()
            chunk_count += 1
            
            # Çok küçük chunk'ları ignore et (noise)
            if len(audio_bytes) < 2000:
                logger.debug("[STT] Chunk too small (%d bytes), skipping", len(audio_bytes))
                continue
            
            # Session buffer'ını al veya oluştur
            buffer = SESSION_BUFFERS.setdefault(session_id, bytearray())
            
            # Yeni chunk'ı buffer'a ekle
            buffer.extend(audio_bytes)
            total_size = len(buffer)
            
            logger.info(
                "[STT] Received audio chunk: %d bytes (chunk #%d), buffer_size=%d",
                len(audio_bytes),
                chunk_count,
                total_size,
            )
            
            # Son Whisper çağrısından bu yana ne kadar yeni veri geldi?
            prev_size = SESSION_LAST_PROCESSED_SIZE.get(session_id, 0)
            delta = total_size - prev_size
            
            logger.debug(
                "[STT] Buffer state: total=%d, prev_processed=%d, delta=%d",
                total_size,
                prev_size,
                delta,
            )
            
            # Whisper çağrısı yapılacak mı?
            if total_size >= MIN_FIRST_STT_BYTES and delta >= MIN_DELTA_BYTES:
                logger.info(
                    "[STT] Calling Whisper: total_size=%d >= %d, delta=%d >= %d",
                    total_size,
                    MIN_FIRST_STT_BYTES,
                    delta,
                    MIN_DELTA_BYTES,
                )
                
                # Tam buffer'ı Whisper'a gönder
                full_audio_bytes = bytes(buffer)
                transcript_full = await transcribe_with_whisper_chunk(full_audio_bytes, language="tr")
                
                if transcript_full and transcript_full.strip():
                    # Önceki tam text
                    prev_text = SESSION_LAST_TEXT.get(session_id, "")
                    
                    # Sadece yeni eklenen kısmı al
                    if transcript_full.startswith(prev_text):
                        new_text = transcript_full[len(prev_text):].strip()
                    else:
                        # Eğer önceki text ile başlamıyorsa, tüm text'i yeni kabul et
                        new_text = transcript_full.strip()
                        logger.warning(
                            "[STT] Transcript doesn't start with previous text, sending full transcript"
                        )
                    
                    # State'i güncelle
                    SESSION_LAST_TEXT[session_id] = transcript_full
                    SESSION_LAST_PROCESSED_SIZE[session_id] = total_size
                    
                    logger.info(
                        "[STT] Whisper result - Full: %s | New: %s",
                        transcript_full[:100] + "..." if len(transcript_full) > 100 else transcript_full,
                        new_text[:100] + "..." if len(new_text) > 100 else new_text,
                    )
                    
                    # Yeni text'i broadcast et
                    if new_text:
                        role_display = "Aday" if role == "candidate" else "Görüşmeci"
                        logger.info("[STT] Broadcasting new text: [%s] %s", role_display, new_text)
                        await broadcast_transcript(session_id, role_display, new_text)
                        logger.info("[STT] Transcript sent to client(s).")
                    else:
                        logger.debug("[STT] No new text to broadcast")
                else:
                    logger.info("[STT] Whisper returned empty text, not broadcasting")
            else:
                logger.debug(
                    "[STT] Skipping Whisper call: total_size=%d < %d or delta=%d < %d",
                    total_size,
                    MIN_FIRST_STT_BYTES,
                    delta,
                    MIN_DELTA_BYTES,
                )
                    
    except WebSocketDisconnect:
        logger.info("[STT] WebSocket disconnected: session_id=%s", session_id)
    except Exception:
        logger.exception("[STT] Unexpected error in STT websocket")
    finally:
        # Session state'i temizle
        SESSION_BUFFERS.pop(session_id, None)
        SESSION_LAST_TEXT.pop(session_id, None)
        SESSION_LAST_PROCESSED_SIZE.pop(session_id, None)
        logger.info("[STT] Cleaned up session state for session_id=%s", session_id)

