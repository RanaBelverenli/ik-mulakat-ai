/**
 * WebRTC Utility Functions
 * Merkezi ICE server yapılandırması ve peer connection oluşturma
 * 
 * Metered TURN/STUN Service Entegrasyonu
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_METERED_DOMAIN: Metered domain (örn: ikmulakat_ai)
 * - NEXT_PUBLIC_METERED_API_KEY: Metered API key
 * - NEXT_PUBLIC_FORCE_TURN_RELAY: "true" ise sadece TURN kullanılır (debug için)
 */

// Fallback STUN sunucuları - Metered erişilemezse kullanılır
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// Cache için
let cachedIceServers: RTCIceServer[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 dakika

/**
 * Metered API'den ICE server'ları çeker
 * TURN + STUN credentials dinamik olarak alınır
 * @returns ICE server listesi
 */
export async function getIceServers(): Promise<RTCIceServer[]> {
  // Cache kontrolü
  if (cachedIceServers && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
    console.log("[WebRTC] ICE servers cache'den alındı");
    return cachedIceServers;
  }

  const domain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;

  console.log("[WebRTC] Metered env check:", {
    hasDomain: !!domain,
    hasApiKey: !!apiKey,
    domain: domain || "undefined",
  });

  if (!domain || !apiKey) {
    console.warn("[WebRTC] ⚠️ Metered env değişkenleri bulunamadı, sadece STUN ile devam ediliyor.");
    console.warn("[WebRTC] ⚠️ Vercel Environment Variables kontrol edin:");
    console.warn("[WebRTC]   - NEXT_PUBLIC_METERED_DOMAIN");
    console.warn("[WebRTC]   - NEXT_PUBLIC_METERED_API_KEY");
    return FALLBACK_ICE_SERVERS;
  }

  try {
    const url = `https://${domain}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
    console.log("[WebRTC] Metered ICE servers isteniyor:", url.replace(apiKey, "***API_KEY***"));

    const res = await fetch(url);
    
    if (!res.ok) {
      console.error("[WebRTC] ❌ Metered ICE isteği başarısız. Status:", res.status);
      return FALLBACK_ICE_SERVERS;
    }

    const iceServers = (await res.json()) as RTCIceServer[];

    console.log("[WebRTC] ✅ Metered ICE servers alındı:", iceServers.length, "adet");
    console.log("[WebRTC] ICE Servers:", 
      iceServers.map((s) => ({
        urls: s.urls,
        hasCredential: !!s.credential,
        type: s.credential ? "TURN" : "STUN",
      }))
    );

    // Cache'e kaydet
    cachedIceServers = iceServers;
    cacheTimestamp = Date.now();

    return iceServers;
  } catch (err) {
    console.error("[WebRTC] ❌ Metered ICE isteğinde hata:", err);
    return FALLBACK_ICE_SERVERS;
  }
}

/**
 * Force TURN relay modunun aktif olup olmadığını kontrol eder
 * @returns boolean
 */
export function isForceTurnRelay(): boolean {
  return process.env.NEXT_PUBLIC_FORCE_TURN_RELAY === "true";
}

/**
 * Interview için RTCPeerConnection oluşturur (ASYNC)
 * Metered'dan dinamik TURN/STUN credentials alır
 * @returns Yapılandırılmış RTCPeerConnection instance
 */
export async function createInterviewPeerConnection(): Promise<RTCPeerConnection> {
  const iceServers = await getIceServers();
  const forceTurnRelay = isForceTurnRelay();

  const config: RTCConfiguration = {
    iceServers,
    iceCandidatePoolSize: 10,
    // Force TURN-only mode (debug için)
    ...(forceTurnRelay ? { iceTransportPolicy: "relay" as RTCIceTransportPolicy } : {}),
  };

  // ICE server'ları logla (credential'lar olmadan)
  console.log("[WebRTC] ========================================");
  console.log("[WebRTC] RTCPeerConnection oluşturuluyor");
  console.log("[WebRTC] ICE Sunucuları:", 
    iceServers.map(s => ({
      urls: s.urls,
      hasCredential: !!s.credential,
      type: s.credential ? "TURN" : "STUN",
    }))
  );
  console.log("[WebRTC] Force TURN Relay:", forceTurnRelay);
  console.log("[WebRTC] ========================================");

  // TURN yoksa uyarı
  const hasTurn = iceServers.some(s => !!s.credential);
  if (!hasTurn) {
    console.error("[WebRTC] ❌❌❌ TURN SUNUCUSU YOK! ❌❌❌");
    console.error("[WebRTC] Farklı ağlardaki kullanıcılar bağlanamayacak!");
  } else {
    console.log("[WebRTC] ✅ TURN sunucusu mevcut - farklı ağlar arası bağlantı destekleniyor");
  }

  const pc = new RTCPeerConnection(config);

  // ICE connection state değişikliklerini logla
  pc.addEventListener("iceconnectionstatechange", () => {
    const state = pc.iceConnectionState;
    console.log("[WebRTC] ICE connection state:", state);
    
    if (state === "checking") {
      console.log("[WebRTC] 🔍 ICE: Bağlantı adayları kontrol ediliyor...");
    } else if (state === "connected") {
      console.log("[WebRTC] ✅ ICE: Bağlantı kuruldu!");
    } else if (state === "completed") {
      console.log("[WebRTC] ✅✅ ICE: Bağlantı tamamlandı!");
    } else if (state === "failed") {
      console.error("[WebRTC] ❌ ICE: Bağlantı BAŞARISIZ!");
      console.error("[WebRTC] Olası nedenler:");
      console.error("[WebRTC]   1. TURN sunucusu erişilemez");
      console.error("[WebRTC]   2. TURN kimlik bilgileri yanlış/süresi dolmuş");
      console.error("[WebRTC]   3. Firewall/NAT engeli");
    } else if (state === "disconnected") {
      console.warn("[WebRTC] ⚠️ ICE: Bağlantı kesildi");
    } else if (state === "closed") {
      console.log("[WebRTC] ICE: Bağlantı kapatıldı");
    }
  });

  // Connection state değişikliklerini logla
  pc.addEventListener("connectionstatechange", () => {
    const state = pc.connectionState;
    console.log("[WebRTC] Connection state:", state);
    
    if (state === "connected") {
      console.log("[WebRTC] 🎉🎉🎉 PEER BAĞLANTISI BAŞARILI! 🎉🎉🎉");
    } else if (state === "failed") {
      console.error("[WebRTC] ❌ Peer bağlantısı başarısız");
    }
  });

  // ICE gathering state değişikliklerini logla
  pc.addEventListener("icegatheringstatechange", () => {
    console.log("[WebRTC] ICE gathering state:", pc.iceGatheringState);
    if (pc.iceGatheringState === "complete") {
      console.log("[WebRTC] ✅ ICE candidate toplama tamamlandı");
    }
  });

  return pc;
}

/**
 * TURN sunucusunun yapılandırılıp yapılandırılmadığını kontrol eder
 * @returns TURN yapılandırılmış mı?
 */
export function isTurnConfigured(): boolean {
  const domain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;
  
  return !!(domain && apiKey);
}

/**
 * ICE candidate tipini parse eder (host, srflx, prflx, relay)
 * @param candidateString Raw candidate string
 * @returns Candidate tipi
 */
export function parseIceCandidateType(candidateString: string): string {
  const match = candidateString.match(/typ\s+(\w+)/);
  return match ? match[1] : "unknown";
}

/**
 * ICE server cache'ini temizler (yeni credentials almak için)
 */
export function clearIceServerCache(): void {
  cachedIceServers = null;
  cacheTimestamp = 0;
  console.log("[WebRTC] ICE server cache temizlendi");
}
