/**
 * STT (Speech-to-Text) Client
 * Aday sesini backend'e göndererek canlı transkript oluşturur
 */

// Backend URL - environment variable'dan al
const getBackendUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ik-mulakat-ai.onrender.com';
  // HTTP/HTTPS'i WSS'e çevir
  return apiUrl.replace(/^http/, 'ws').replace(/\/$/, '');
};

export type SttRole = 'candidate' | 'interviewer';

interface SttClientOptions {
  sessionId: string;
  role: SttRole;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

/**
 * Audio stream'i STT WebSocket'ine gönderen client
 */
export class SttClient {
  private ws: WebSocket | null = null;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private sessionId: string;
  private role: SttRole;
  private onOpen?: () => void;
  private onClose?: () => void;
  private onError?: (error: Event) => void;

  constructor(options: SttClientOptions) {
    this.sessionId = options.sessionId;
    this.role = options.role;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
  }

  /**
   * STT'yi başlat - audio stream'i backend'e göndermeye başla
   */
  start(stream: MediaStream): void {
    if (this.ws) {
      console.warn('[STT] Zaten bağlı, önce stop() çağırın');
      return;
    }

    this.stream = stream;

    const backendUrl = getBackendUrl();
    const wsUrl = `${backendUrl}/api/v1/stt/ws/stt?session_id=${this.sessionId}&role=${this.role}`;

    console.log('[STT] WebSocket bağlantısı kuruluyor:', wsUrl);

    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('[STT] ✅ WebSocket opened');
      this.startRecording();
      this.onOpen?.();
    };

    this.ws.onclose = (event) => {
      console.log('[STT] WebSocket closed:', event.code, event.reason);
      this.stopRecording();
      this.onClose?.();
    };

    this.ws.onerror = (error) => {
      console.error('[STT] ❌ WebSocket error:', error);
      this.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      // Backend'den gelen mesajları logla (debug için)
      console.log('[STT] Message from server:', event.data);
    };
  }

  /**
   * MediaRecorder'ı başlat ve audio chunk'larını WebSocket'e gönder
   */
  private startRecording(): void {
    if (!this.stream || !this.ws) {
      console.error('[STT] Stream veya WebSocket yok');
      return;
    }

    // Audio track'leri kontrol et
    const audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.error('[STT] Stream\'de audio track yok');
      return;
    }

    console.log('[STT] Audio tracks:', audioTracks.map(t => ({
      id: t.id,
      enabled: t.enabled,
      readyState: t.readyState
    })));

    // Sadece audio track'lerle yeni stream oluştur
    const audioStream = new MediaStream(audioTracks);

    // MediaRecorder için desteklenen MIME type'ı bul
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      console.error('[STT] Desteklenen MIME type bulunamadı');
      return;
    }

    console.log('[STT] MediaRecorder MIME type:', selectedMimeType);

    try {
      this.recorder = new MediaRecorder(audioStream, {
        mimeType: selectedMimeType,
      });

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            this.ws?.send(buffer);
            console.log(`[STT] Chunk gönderildi: ${buffer.byteLength} bytes`);
          });
        }
      };

      this.recorder.onerror = (event) => {
        console.error('[STT] MediaRecorder error:', event);
      };

      this.recorder.onstart = () => {
        console.log('[STT] ✅ MediaRecorder started');
      };

      this.recorder.onstop = () => {
        console.log('[STT] MediaRecorder stopped');
      };

      // Her 500ms'de bir chunk gönder
      this.recorder.start(500);

    } catch (error) {
      console.error('[STT] MediaRecorder oluşturma hatası:', error);
    }
  }

  /**
   * MediaRecorder'ı durdur
   */
  private stopRecording(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      console.log('[STT] MediaRecorder durduruluyor...');
      this.recorder.stop();
    }
    this.recorder = null;
  }

  /**
   * STT'yi durdur ve temizle
   */
  stop(): void {
    console.log('[STT] Durduruluyor...');
    
    this.stopRecording();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client closing');
      }
      this.ws = null;
    }

    this.stream = null;
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Aday sesini STT'ye göndermeye başla
 * 
 * @param stream Aday audio stream'i (WebRTC ontrack'ten gelen)
 * @param sessionId Mülakat oturum ID'si
 * @returns SttClient instance (durdurmak için stop() çağırın)
 */
export function startCandidateStt(stream: MediaStream, sessionId: string): SttClient {
  const client = new SttClient({
    sessionId,
    role: 'candidate',
    onOpen: () => {
      console.log('[STT] 🎤 Aday ses kaydı başladı');
    },
    onClose: () => {
      console.log('[STT] 🛑 Aday ses kaydı durdu');
    },
    onError: (error) => {
      console.error('[STT] Aday ses kaydı hatası:', error);
    },
  });

  client.start(stream);
  return client;
}

