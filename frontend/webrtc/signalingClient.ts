/**
 * WebRTC Signaling Client
 * WebSocket üzerinden WebRTC signaling mesajlarını yönetir
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_BASE_URL.replace("http://", "ws://").replace("https://", "wss://");

export type SignalingMessage = {
  type: "offer" | "answer" | "ice-candidate" | "user-joined" | "user-left";
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
        console.log("WebSocket bağlantısı kuruluyor:", wsUrl);
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

        this.ws.onclose = () => {
          console.log("WebSocket bağlantısı kapandı");
          // Otomatik yeniden bağlanmayı dene
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
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
