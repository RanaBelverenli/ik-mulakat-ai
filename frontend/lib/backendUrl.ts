/**
 * Backend URL Helper
 * Merkezi backend URL yönetimi için helper fonksiyon
 */

/**
 * Backend base URL'ini döndürür
 * Production'da NEXT_PUBLIC_API_URL environment variable'ından alır
 * Development'ta fallback olarak localhost:8000 kullanır
 */
export function getBackendUrl(): string {
  // Vercel'de NEXT_PUBLIC_API_URL set edilmeli
  // Fallback: Render backend URL (production)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ik-mulakat-ai.onrender.com';
  
  // Trailing slash'i temizle
  return apiUrl.replace(/\/$/, '');
}

/**
 * WebSocket URL'ini döndürür (HTTP/HTTPS'den WSS'e çevirir)
 */
export function getBackendWsUrl(): string {
  const httpUrl = getBackendUrl();
  // HTTP -> WS, HTTPS -> WSS
  return httpUrl.replace(/^http/, 'ws');
}

/**
 * Development modunda detaylı logging için
 */
export function logBackendUrl(): void {
  if (process.env.NODE_ENV === 'development') {
    const url = getBackendUrl();
    console.log('[Backend URL] Using backend URL:', url);
    console.log('[Backend URL] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'not set (using fallback)');
  }
}

