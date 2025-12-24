/**
 * WebRTC Utility Functions
 * Merkezi ICE server yapılandırması ve peer connection oluşturma
 */

// Varsayılan STUN sunucuları
const defaultIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
];

/**
 * Environment variables'dan TURN server yapılandırmasını okur
 * @returns TURN server yapılandırması veya boş array
 */
function getTurnServersFromEnv(): RTCIceServer[] {
  // NEXT_PUBLIC_ prefix'i ile browser-safe env variables
  const turnUrls = process.env.NEXT_PUBLIC_TURN_URLS;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

  // TURN yapılandırması yoksa, sadece STUN kullan
  if (!turnUrls || !turnUsername || !turnPassword) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[WebRTC] TURN yapılandırılmamış. Sadece STUN kullanılacak.');
      console.warn('[WebRTC] Farklı ağlar arası bağlantı için TURN gerekebilir.');
    }
    return [];
  }

  // Virgülle ayrılmış URL'leri parse et
  const urlsArray = turnUrls
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  if (urlsArray.length === 0) {
    return [];
  }

  console.log('[WebRTC] TURN sunucuları yapılandırıldı:', urlsArray.length, 'adet');

  return [
    {
      urls: urlsArray,
      username: turnUsername,
      credential: turnPassword,
    },
  ];
}

/**
 * ICE server listesini döndürür (STUN + TURN)
 * @returns RTCIceServer dizisi
 */
export function getIceServers(): RTCIceServer[] {
  return [...defaultIceServers, ...getTurnServersFromEnv()];
}

/**
 * Interview için RTCPeerConnection oluşturur
 * STUN ve TURN sunucuları ile yapılandırılmış
 * @returns Yapılandırılmış RTCPeerConnection instance
 */
export function createInterviewPeerConnection(): RTCPeerConnection {
  const iceServers = getIceServers();

  const config: RTCConfiguration = {
    iceServers,
    // ICE candidate toplama stratejisi
    iceCandidatePoolSize: 10,
    // Sadece TURN kullanmak için (debug amaçlı):
    // iceTransportPolicy: 'relay',
  };

  // Development modunda ICE server'ları logla (credential'lar olmadan)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WebRTC] RTCPeerConnection oluşturuluyor. ICE sunucuları:', 
      iceServers.map(s => ({
        urls: s.urls,
        hasCredential: !!s.credential,
      }))
    );
  }

  const pc = new RTCPeerConnection(config);

  // ICE connection state değişikliklerini logla
  pc.addEventListener('iceconnectionstatechange', () => {
    const state = pc.iceConnectionState;
    console.log('[WebRTC] ICE connection state:', state);
    
    // ICE bağlantı durumu hakkında ek bilgi
    if (state === 'checking') {
      console.log('[WebRTC] ICE: Bağlantı kontrol ediliyor...');
    } else if (state === 'connected') {
      console.log('[WebRTC] ICE: Bağlantı kuruldu! ✅');
    } else if (state === 'completed') {
      console.log('[WebRTC] ICE: Bağlantı tamamlandı! ✅✅');
    } else if (state === 'failed') {
      console.error('[WebRTC] ICE: Bağlantı başarısız! ❌');
      console.error('[WebRTC] TURN sunucusu yapılandırılmış mı kontrol edin.');
    } else if (state === 'disconnected') {
      console.warn('[WebRTC] ICE: Bağlantı kesildi. ⚠️');
    } else if (state === 'closed') {
      console.log('[WebRTC] ICE: Bağlantı kapatıldı.');
    }
  });

  // Connection state değişikliklerini logla
  pc.addEventListener('connectionstatechange', () => {
    const state = pc.connectionState;
    console.log('[WebRTC] Connection state:', state);
    
    if (state === 'connected') {
      console.log('[WebRTC] 🎉 Peer bağlantısı başarıyla kuruldu!');
    } else if (state === 'failed') {
      console.error('[WebRTC] ❌ Peer bağlantısı başarısız oldu.');
    }
  });

  // ICE gathering state değişikliklerini logla
  pc.addEventListener('icegatheringstatechange', () => {
    console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
  });

  return pc;
}

/**
 * TURN sunucusunun yapılandırılıp yapılandırılmadığını kontrol eder
 * @returns TURN yapılandırılmış mı?
 */
export function isTurnConfigured(): boolean {
  const turnUrls = process.env.NEXT_PUBLIC_TURN_URLS;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;
  
  return !!(turnUrls && turnUsername && turnPassword);
}

