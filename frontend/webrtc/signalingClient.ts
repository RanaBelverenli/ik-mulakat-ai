/**
 * WebRTC Signaling Client
 * WebSocket üzerinden WebRTC signaling mesajlarını yönetir
 */

// Production ve development için WebSocket URL'ini oluştur
// Render URL'si HTTPS ile başladığı için, onu güvenli WebSocket protokolüne (wss) çevir
const getWebSocketUrl = (): string => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // URL'i normalize et - başında/sonunda boşlukları temizle
  let baseUrl = API_BASE_URL.trim();
  
  // Trailing slash'i kaldır
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // Production ortamını kontrol et (Vercel veya başka bir HTTPS host)
  const isProduction = typeof window !== "undefined" && 
    (window.location.protocol === "https:" || 
     window.location.hostname !== "localhost" &&
     window.location.hostname !== "127.0.0.1");
  
  // WebSocket protokolünü belirle:
  // - HTTPS URL'leri -> WSS (güvenli WebSocket)
  // - HTTP URL'leri -> WS (development için)
  // - Production ortamında her zaman WSS kullan
  if (baseUrl.startsWith("https://")) {
    // Render veya başka bir HTTPS backend için WSS kullan
    return baseUrl.replace("https://", "wss://");
  } else if (baseUrl.startsWith("http://")) {
    // Development için WS kullan, ama production ortamındaysak WSS'ye çevir
    if (isProduction) {
      // Production ortamında HTTP backend varsa (nadir), WSS'ye çevir
      return baseUrl.replace("http://", "wss://");
    } else {
      // Development için WS kullan
      return baseUrl.replace("http://", "ws://");
    }
  } else {
    // Protokol belirtilmemişse, production durumuna göre ekle
    if (isProduction) {
      return `wss://${baseUrl}`;
    } else {
      return `ws://${baseUrl}`;
    }
  }
};

const WS_URL = getWebSocketUrl();

export type SignalingMessage = {
  type: "offer" | "answer" | "ice-candidate" | "user-joined" | "user-left" | "room-info" | "ping" | "pong";
  data?: any;
  from?: string;
};

export class SignalingClient {
  private ws: WebSocket | null = null;
  private roomId: string;
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // WebSocket URL'ini oluştur
        const wsUrl = `${WS_URL}/api/v1/signaling/ws/${this.roomId}`;
        console.log("🔌 WebSocket bağlantısı kuruluyor:", wsUrl);
        console.log("🔌 Environment:", {
          API_URL: process.env.NEXT_PUBLIC_API_URL,
          Protocol: typeof window !== "undefined" ? window.location.protocol : "unknown",
          Hostname: typeof window !== "undefined" ? window.location.hostname : "unknown"
        });
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket bağlantısı kuruldu");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            if (this.onMessageCallback) {
              this.onMessageCallback(message);
            }
          } catch (error) {
            console.error("Mesaj parse hatası:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket hatası:", error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket bağlantısı kapandı", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          // Eğer temiz bir kapanış değilse, yeniden bağlanmayı dene
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`⏳ ${delay}ms sonra yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.connect().catch((err) => {
                console.error("❌ Yeniden bağlanma hatası:", err);
              });
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("❌ Maksimum yeniden bağlanma denemesi aşıldı");
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket bağlantısı açık değil");
    }
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
