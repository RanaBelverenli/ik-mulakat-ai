"""
STT (Speech-to-Text) and Transcript WebSocket endpoints
Canlı transkript sistemi için WebSocket endpoint'leri
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, List
import asyncio
import logging

logger = logging.getLogger(__name__)

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
    Audio bytes'ı text'e çevir (STT)
    
    Şimdilik dummy implementation; ileride Whisper / OpenAI / Google STT
    entegrasyonu buraya gelecek.
    
    Args:
        data: Audio bytes (webm/opus format)
    
    Returns:
        Transcribed text
    """
    # Dummy implementation - gerçek STT için burası değiştirilecek
    # Örnek: OpenAI Whisper, Google Speech-to-Text, Azure Speech, vs.
    
    # Ses verisinin boyutuna göre basit bir dummy response
    audio_length_seconds = len(data) / (16000 * 2)  # Yaklaşık hesaplama
    
    if audio_length_seconds < 1:
        return ""
    elif audio_length_seconds < 3:
        return "[Konuşma algılandı - kısa segment]"
    else:
        return f"[STT Test: {audio_length_seconds:.1f} saniyelik ses verisi işlendi]"


async def broadcast_transcript(session_id: str, role: str, text: str):
    """
    Transcript mesajını session'daki tüm client'lara gönder
    
    Args:
        session_id: Mülakat oturum ID'si
        role: "Aday" veya "Görüşmeci"
        text: Transcribe edilmiş metin
    """
    clients = get_session_clients(session_id)
    disconnected_clients = []
    
    for client in clients:
        try:
            await client.send_json({
                "role": role,
                "text": text,
            })
        except Exception as e:
            logger.warning(f"Transcript gönderim hatası: {e}")
            disconnected_clients.append(client)
    
    # Bağlantısı kopan client'ları temizle
    for client in disconnected_clients:
        if client in clients:
            clients.remove(client)


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
    logger.info(f"[STT WS] Yeni STT client bağlandı. Session: {session_id}, Role: {role}")
    
    audio_buffer = bytearray()
    
    # Minimum buffer boyutu (yaklaşık 2-3 saniye ses)
    MIN_BUFFER_SIZE = 16000 * 2 * 2  # 16kHz, 16-bit, 2 saniye
    
    try:
        while True:
            # Binary audio data al
            chunk = await ws.receive_bytes()
            audio_buffer.extend(chunk)
            
            logger.debug(f"[STT WS] Chunk alındı: {len(chunk)} bytes, Buffer: {len(audio_buffer)} bytes")
            
            # Yeterli veri biriktiğinde transcribe et
            if len(audio_buffer) >= MIN_BUFFER_SIZE:
                text = await transcribe_bytes(bytes(audio_buffer))
                audio_buffer.clear()
                
                # Boş olmayan text'i broadcast et
                if text and text.strip():
                    role_display = "Aday" if role == "candidate" else "Görüşmeci"
                    logger.info(f"[STT WS] Transcript: [{role_display}] {text}")
                    
                    await broadcast_transcript(session_id, role_display, text)
                    
    except WebSocketDisconnect:
        logger.info(f"[STT WS] Client ayrıldı. Session: {session_id}")
    except Exception as e:
        logger.error(f"[STT WS] Hata: {e}")
    finally:
        # Kalan buffer'ı işle
        if len(audio_buffer) > 0:
            text = await transcribe_bytes(bytes(audio_buffer))
            if text and text.strip():
                role_display = "Aday" if role == "candidate" else "Görüşmeci"
                await broadcast_transcript(session_id, role_display, text)

