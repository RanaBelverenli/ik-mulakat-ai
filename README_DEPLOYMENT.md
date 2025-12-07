# Deployment Rehberi - Vercel (Frontend) + Render (Backend)

## Ön Gereksinimler

1. **Vercel hesabı** (frontend için)
2. **Render hesabı** (backend için)
3. **GitHub repository** (kodlarınız için)

## Backend Deployment (Render)

### 1. Render'da Yeni Web Service Oluşturun

1. Render Dashboard'a gidin: https://dashboard.render.com
2. **New +** → **Web Service** seçin
3. GitHub repository'nizi bağlayın
4. Ayarları yapılandırın:
   - **Name**: `ik-mulakat-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

### 2. Environment Variables Ekleyin

Render Dashboard'da **Environment** sekmesine gidin ve şu değişkenleri ekleyin:

```
FRONTEND_URL=https://your-vercel-app.vercel.app
PORT=10000
```

### 3. Backend URL'ini Not Edin

Render size bir URL verecek (örnek: `https://ik-mulakat-ai-backend.onrender.com`)
Bu URL'i kopyalayın, frontend'de kullanacağız.

## Frontend Deployment (Vercel)

### 1. Vercel'de Yeni Proje Oluşturun

1. Vercel Dashboard'a gidin: https://vercel.com
2. **Add New** → **Project** seçin
3. GitHub repository'nizi bağlayın
4. Ayarları yapılandırın:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (otomatik)
   - **Output Directory**: `.next` (otomatik)

### 2. Environment Variables Ekleyin

Vercel Dashboard'da **Settings** → **Environment Variables** sekmesine gidin ve şu değişkenleri ekleyin:

```
NEXT_PUBLIC_API_URL=https://ik-mulakat-ai-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://ecwxwbznfqhysjkzzibm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**ÖNEMLİ**: `NEXT_PUBLIC_API_URL` değeri Render'dan aldığınız backend URL'i olmalı!

### 3. Deploy Edin

1. **Deploy** butonuna tıklayın
2. Build tamamlanana kadar bekleyin
3. Deployment URL'ini not edin (örnek: `https://ik-mulakat-ai.vercel.app`)

## WebSocket Bağlantısı Kontrolü

### Backend URL Formatı

Backend URL'iniz şu formatta olmalı:
- ✅ `https://ik-mulakat-ai-backend.onrender.com` (HTTPS)
- ❌ `http://ik-mulakat-ai-backend.onrender.com` (HTTP - çalışmaz)

### WebSocket URL'i

WebSocket URL'i otomatik olarak oluşturulur:
- Backend: `https://ik-mulakat-ai-backend.onrender.com`
- WebSocket: `wss://ik-mulakat-ai-backend.onrender.com/api/v1/signaling/ws/{room_id}`

## Test Etme

1. **Frontend'i açın**: Vercel URL'iniz (örnek: `https://ik-mulakat-ai.vercel.app`)
2. **Admin olarak giriş yapın** ve görüntülü mülakatı açın
3. **Başka bir tarayıcı/sekmede kullanıcı olarak giriş yapın**
4. **Her iki tarafta da konsolu açın** (F12) ve logları kontrol edin

### Beklenen Loglar

**Frontend (Her iki taraf):**
```
🔌 WebSocket bağlantısı kuruluyor: wss://...
🔌 WebSocket bağlantısı kuruldu
🔧 WebRTC başlatıldı
📤 Offer oluşturuldu (admin tarafında)
📥 Answer gönderildi (kullanıcı tarafında)
🎥 Remote stream alındı
```

**Backend (Render Logs):**
```
Client connected to room interview-room-1. Total connections: 1
Client connected to room interview-room-1. Total connections: 2
Room interview-room-1: Mesaj alındı - Tip: offer
Room interview-room-1: Mesaj gönderildi (tip: offer)
```

## Sorun Giderme

### WebSocket Bağlantısı Kurulmuyor

1. **Backend URL'ini kontrol edin**: `NEXT_PUBLIC_API_URL` doğru mu?
2. **HTTPS kullanıldığından emin olun**: Render otomatik HTTPS sağlar
3. **CORS ayarlarını kontrol edin**: Backend'de `allow_origins=["*"]` olmalı
4. **Render Logs'u kontrol edin**: WebSocket bağlantı istekleri görünüyor mu?

### Remote Video Görünmüyor

1. **Konsol loglarını kontrol edin**: "Remote stream alındı" mesajı var mı?
2. **ICE candidate'ları kontrol edin**: "ICE candidate alındı" mesajları var mı?
3. **Connection state'i kontrol edin**: "Connection state: connected" mesajı var mı?

### Render'da WebSocket Sorunları

Render'da WebSocket desteği için:
- ✅ WebSocket endpoint'leri doğru çalışmalı
- ✅ CORS ayarları doğru olmalı
- ✅ Port ayarları doğru olmalı (`$PORT` environment variable kullanın)

## Önemli Notlar

1. **Environment Variables**: Production'da mutlaka doğru set edilmelidir
2. **HTTPS/WSS**: Production'da mutlaka HTTPS ve WSS kullanılmalıdır
3. **CORS**: Backend'de tüm origin'lere izin verilmelidir (veya sadece Vercel URL'inize)
4. **WebSocket Timeout**: Render'da WebSocket bağlantıları timeout olabilir, yeniden bağlanma mekanizması var

## Destek

Sorun yaşarsanız:
1. Tarayıcı konsolundaki hataları kontrol edin
2. Render Logs'u kontrol edin
3. Vercel Deployment Logs'unu kontrol edin

