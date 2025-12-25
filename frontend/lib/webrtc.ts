/**
 * WebRTC Utility Functions
 * Merkezi ICE server yapılandırması ve peer connection oluşturma
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_TURN_URLS: Virgülle ayrılmış TURN URL'leri
 * - NEXT_PUBLIC_TURN_USERNAME: TURN kullanıcı adı
 * - NEXT_PUBLIC_TURN_PASSWORD: TURN şifresi
 * - NEXT_PUBLIC_FORCE_TURN_RELAY: "true" ise sadece TURN kullanılır (debug için)
 */

// Varsayılan STUN sunucuları
const defaultIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
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

  console.log('[WebRTC] TURN env check:', {
    hasUrls: !!turnUrls,
    hasUsername: !!turnUsername,
    hasPassword: !!turnPassword,
    urlsValue: turnUrls ? `${turnUrls.substring(0, 30)}...` : 'undefined',
  });

  // TURN yapılandırması yoksa, sadece STUN kullan
  if (!turnUrls || !turnUsername || !turnPassword) {
    console.warn('[WebRTC] ⚠️ TURN yapılandırılmamış. Sadece STUN kullanılacak.');
    console.warn('[WebRTC] ⚠️ Farklı ağlar arası bağlantı için TURN gerekir!');
    console.warn('[WebRTC] Vercel Environment Variables kontrol edin:');
    console.warn('[WebRTC]   - NEXT_PUBLIC_TURN_URLS');
    console.warn('[WebRTC]   - NEXT_PUBLIC_TURN_USERNAME');
    console.warn('[WebRTC]   - NEXT_PUBLIC_TURN_PASSWORD');
    return [];
  }

  // Virgülle ayrılmış URL'leri parse et
  const urlsArray = turnUrls
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  if (urlsArray.length === 0) {
    console.warn('[WebRTC] ⚠️ TURN URLs boş! STUN-only modunda.');
    return [];
  }

  console.log('[WebRTC] ✅ TURN sunucuları yapılandırıldı:', urlsArray.length, 'adet');
  console.log('[WebRTC] TURN URLs:', urlsArray);

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
 * Force TURN relay modunun aktif olup olmadığını kontrol eder
 * @returns boolean
 */
export function isForceTurnRelay(): boolean {
  return process.env.NEXT_PUBLIC_FORCE_TURN_RELAY === 'true';
}

/**
 * Interview için RTCPeerConnection oluşturur
 * STUN ve TURN sunucuları ile yapılandırılmış
 * @returns Yapılandırılmış RTCPeerConnection instance
 */
export function createInterviewPeerConnection(): RTCPeerConnection {
  const iceServers = getIceServers();
  const forceTurnRelay = isForceTurnRelay();

  const config: RTCConfiguration = {
    iceServers,
    iceCandidatePoolSize: 10,
    // Force TURN-only mode (debug için)
    ...(forceTurnRelay ? { iceTransportPolicy: 'relay' as RTCIceTransportPolicy } : {}),
  };

  // ICE server'ları logla (credential'lar olmadan)
  console.log('[WebRTC] ========================================');
  console.log('[WebRTC] RTCPeerConnection oluşturuluyor');
  console.log('[WebRTC] ICE Sunucuları:', 
    iceServers.map(s => ({
      urls: s.urls,
      hasCredential: !!s.credential,
      type: s.credential ? 'TURN' : 'STUN',
    }))
  );
  console.log('[WebRTC] Force TURN Relay:', forceTurnRelay);
  console.log('[WebRTC] ========================================');

  // TURN yoksa uyarı
  const hasTurn = iceServers.some(s => !!s.credential);
  if (!hasTurn) {
    console.error('[WebRTC] ❌❌❌ TURN SUNUCUSU YOK! ❌❌❌');
    console.error('[WebRTC] Farklı ağlardaki kullanıcılar bağlanamayacak!');
  }

  const pc = new RTCPeerConnection(config);

  // ICE connection state değişikliklerini logla
  pc.addEventListener('iceconnectionstatechange', () => {
    const state = pc.iceConnectionState;
    console.log('[WebRTC] ICE connection state:', state);
    
    if (state === 'checking') {
      console.log('[WebRTC] 🔍 ICE: Bağlantı aday adayları kontrol ediliyor...');
    } else if (state === 'connected') {
      console.log('[WebRTC] ✅ ICE: Bağlantı kuruldu!');
    } else if (state === 'completed') {
      console.log('[WebRTC] ✅✅ ICE: Bağlantı tamamlandı!');
    } else if (state === 'failed') {
      console.error('[WebRTC] ❌ ICE: Bağlantı BAŞARISIZ!');
      console.error('[WebRTC] Olası nedenler:');
      console.error('[WebRTC]   1. TURN sunucusu yapılandırılmamış');
      console.error('[WebRTC]   2. TURN kimlik bilgileri yanlış');
      console.error('[WebRTC]   3. Firewall/NAT engeli');
    } else if (state === 'disconnected') {
      console.warn('[WebRTC] ⚠️ ICE: Bağlantı kesildi');
    } else if (state === 'closed') {
      console.log('[WebRTC] ICE: Bağlantı kapatıldı');
    }
  });

  // Connection state değişikliklerini logla
  pc.addEventListener('connectionstatechange', () => {
    const state = pc.connectionState;
    console.log('[WebRTC] Connection state:', state);
    
    if (state === 'connected') {
      console.log('[WebRTC] 🎉🎉🎉 PEER BAĞLANTISI BAŞARILI! 🎉🎉🎉');
    } else if (state === 'failed') {
      console.error('[WebRTC] ❌ Peer bağlantısı başarısız');
    }
  });

  // ICE gathering state değişikliklerini logla
  pc.addEventListener('icegatheringstatechange', () => {
    console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
    if (pc.iceGatheringState === 'complete') {
      console.log('[WebRTC] ✅ ICE candidate toplama tamamlandı');
    }
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

/**
 * ICE candidate tipini parse eder (host, srflx, prflx, relay)
 * @param candidateString Raw candidate string
 * @returns Candidate tipi
 */
export function parseIceCandidateType(candidateString: string): string {
  const match = candidateString.match(/typ\s+(\w+)/);
  return match ? match[1] : 'unknown';
}
