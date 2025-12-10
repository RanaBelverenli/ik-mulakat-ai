"""
WebRTC signaling endpoints for peer connection establishment
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/signaling", tags=["signaling"])

# Store active WebSocket connections by room ID
active_connections: Dict[str, Set[WebSocket]] = {}


async def send_ping(websocket: WebSocket):
    """Send periodic ping to keep connection alive"""
    try:
        while True:
            await asyncio.sleep(25)  # Her 25 saniyede bir ping gönder
            try:
                await websocket.send_text(json.dumps({"type": "ping"}))
                logger.debug("Ping sent to keep connection alive")
            except Exception:
                break
    except asyncio.CancelledError:
        pass


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for WebRTC signaling
    Handles offer, answer, and ICE candidate exchange between peers
    """
    await websocket.accept()
    
    # Add connection to room
    if room_id not in active_connections:
        active_connections[room_id] = set()
    active_connections[room_id].add(websocket)
    
    connection_count = len(active_connections[room_id])
    logger.info(f"Client connected to room {room_id}. Total connections: {connection_count}")
    
    # Diğer kullanıcılara yeni kullanıcının katıldığını bildir
    for connection in active_connections[room_id]:
        if connection != websocket:
            try:
                await connection.send_text(json.dumps({
                    "type": "user-joined",
                    "data": {"room_id": room_id, "user_count": connection_count}
                }))
            except Exception as e:
                logger.error(f"Error notifying user-joined: {e}")
    
    # Yeni kullanıcıya odadaki toplam kullanıcı sayısını bildir
    await websocket.send_text(json.dumps({
        "type": "room-info",
        "data": {"room_id": room_id, "user_count": connection_count}
    }))
    
    # Ping task'ı başlat (Render free tier için keep-alive)
    ping_task = asyncio.create_task(send_ping(websocket))
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Ping/pong mesajlarını işle
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue
            elif message.get("type") == "pong":
                continue  # Pong aldık, devam et
            
            logger.info(f"Room {room_id}: Mesaj alındı - Tip: {message.get('type')}, Bağlantı sayısı: {len(active_connections[room_id])}")
            
            # Broadcast message to all other clients in the room
            sent_count = 0
            for connection in active_connections[room_id]:
                if connection != websocket:
                    try:
                        await connection.send_text(json.dumps(message))
                        sent_count += 1
                        logger.info(f"Room {room_id}: Mesaj gönderildi (tip: {message.get('type')})")
                    except Exception as e:
                        logger.error(f"Error sending message: {e}")
            
            if sent_count == 0:
                logger.warning(f"Room {room_id}: Mesaj gönderilemedi - diğer kullanıcı yok")
                        
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Ping task'ı iptal et
        ping_task.cancel()
        
        # Remove connection from room
        active_connections[room_id].discard(websocket)
        
        # Diğer kullanıcılara kullanıcının ayrıldığını bildir
        if room_id in active_connections:
            for connection in active_connections[room_id]:
                try:
                    await connection.send_text(json.dumps({
                        "type": "user-left",
                        "data": {"room_id": room_id, "user_count": len(active_connections[room_id])}
                    }))
                except Exception:
                    pass
            
            if not active_connections[room_id]:
                del active_connections[room_id]

