# Frontend Environment Variables

`.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# API Base URL (Backend)
NEXT_PUBLIC_API_URL=https://ik-mulakat-ai.onrender.com/

# ===========================================
# WebRTC TURN Server Yapılandırması
# ===========================================
# Farklı ağlar arası (NAT/firewall arkası) video bağlantısı için gerekli
# TURN sunucusu olmadan sadece aynı ağdaki cihazlar bağlanabilir

# TURN sunucu URL'leri (virgülle ayrılmış)
# Örnek: turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp
NEXT_PUBLIC_TURN_URLS=

# TURN kimlik bilgileri
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_PASSWORD=
```

## Ücretsiz TURN Sunucu Seçenekleri

### 1. OpenRelay (ücretsiz, test için)
```env
NEXT_PUBLIC_TURN_URLS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443
NEXT_PUBLIC_TURN_USERNAME=openrelayproject
NEXT_PUBLIC_TURN_PASSWORD=openrelayproject
```

### 2. Metered.ca
Ücretsiz tier mevcut: https://www.metered.ca/tools/openrelay/

### 3. Twilio (ücretli ama güvenilir)
https://www.twilio.com/stun-turn

### 4. Xirsys (ücretsiz tier mevcut)
https://xirsys.com/

## Vercel'de Environment Variables Ekleme

1. Vercel Dashboard → Projeniz → Settings → Environment Variables
2. Aşağıdaki değişkenleri ekleyin:
   - `NEXT_PUBLIC_TURN_URLS`
   - `NEXT_PUBLIC_TURN_USERNAME`
   - `NEXT_PUBLIC_TURN_PASSWORD`
3. Redeploy yapın

