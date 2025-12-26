# Frontend Environment Variables

`.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# API Base URL (Backend)
NEXT_PUBLIC_API_URL=https://ik-mulakat-ai.onrender.com/

# ===========================================
# Metered TURN/STUN Service (ÖNERİLEN)
# ===========================================
# https://www.metered.ca/ üzerinden ücretsiz hesap oluşturun
# Dinamik TURN credentials sağlar - daha güvenilir

NEXT_PUBLIC_METERED_DOMAIN=ikmulakat_ai
NEXT_PUBLIC_METERED_API_KEY=your_metered_api_key_here

# ===========================================
# Debug Options (Opsiyonel)
# ===========================================
# TURN-only mode - sadece relay kullan (debug için)
# NEXT_PUBLIC_FORCE_TURN_RELAY=true
```

## Metered.ca Kurulumu

1. https://www.metered.ca/ adresinde hesap oluşturun
2. Dashboard'dan "TURN Server" bölümüne gidin
3. "Application Name" oluşturun (örn: `ikmulakat_ai`)
4. API Key'i kopyalayın
5. Vercel'de aşağıdaki değişkenleri ekleyin:
   - `NEXT_PUBLIC_METERED_DOMAIN` = `ikmulakat_ai` (veya sizin app adınız)
   - `NEXT_PUBLIC_METERED_API_KEY` = API Key

## Vercel'de Environment Variables Ekleme

1. Vercel Dashboard → Projeniz → Settings → Environment Variables
2. Aşağıdaki değişkenleri ekleyin:
   - `NEXT_PUBLIC_METERED_DOMAIN`
   - `NEXT_PUBLIC_METERED_API_KEY`
3. Redeploy yapın

## Beklenen Console Çıktısı

```
[WebRTC] Metered ICE servers isteniyor: https://ikmulakat_ai.metered.live/api/v1/turn/credentials?apiKey=***
[WebRTC] ✅ Metered ICE servers alındı: 4 adet
[WebRTC] ICE Servers: [
  {urls: 'stun:stun.metered.ca:5349', hasCredential: false, type: 'STUN'},
  {urls: 'turn:turn.metered.ca:5349?transport=udp', hasCredential: true, type: 'TURN'},
  {urls: 'turn:turn.metered.ca:443?transport=tcp', hasCredential: true, type: 'TURN'},
  ...
]
[WebRTC] ✅ TURN sunucusu mevcut - farklı ağlar arası bağlantı destekleniyor
```

