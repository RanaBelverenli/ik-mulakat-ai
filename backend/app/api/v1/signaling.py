"""
WebRTC signaling endpoints for peer connection establishment
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/signaling", tags=["signaling"])

# Store active WebSocket connections by room ID
active_connections: Dict[str, Set[WebSocket]] = {}


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
    
    logger.info(f"Client connected to room {room_id}. Total connections: {len(active_connections[room_id])}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
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
        # Remove connection from room
        active_connections[room_id].discard(websocket)
        if not active_connections[room_id]:
            del active_connections[room_id]

