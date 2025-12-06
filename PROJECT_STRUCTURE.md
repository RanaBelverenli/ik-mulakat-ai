# 📁 Proje Dosya Mimarisi

## 🏗️ Genel Yapı

```
ik_mulakat_ai/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI uygulama giriş noktası
│   │   ├── api/               # API endpoint'leri
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── audio_stream.py    # Ses akışı endpoint'leri
│   │   │       ├── auth.py            # Kimlik doğrulama endpoint'leri
│   │   │       ├── candidates.py      # Aday yönetimi endpoint'leri
│   │   │       ├── interviews.py      # Mülakat endpoint'leri
│   │   │       └── signaling.py      # WebRTC signaling endpoint'leri
│   │   ├── core/              # Çekirdek modüller
│   │   │   ├── config.py      # Yapılandırma ayarları
│   │   │   ├── security.py    # Güvenlik ve JWT işlemleri
│   │   │   └── utils.py       # Yardımcı fonksiyonlar
│   │   ├── models/            # Veri modelleri
│   │   │   ├── analysis_model.py      # Analiz modeli
│   │   │   ├── interview_model.py     # Mülakat modeli
│   │   │   └── user_model.py          # Kullanıcı modeli
│   │   └── services/          # İş mantığı servisleri
│   │       ├── asr_service.py          # Otomatik Konuşma Tanıma servisi
│   │       ├── llm_service.py         # LLM (AI) servisi
│   │       ├── report_service.py      # Rapor oluşturma servisi
│   │       └── webrtc_service.py      # WebRTC servisi
│   ├── data/                  # Veri klasörleri
│   │   ├── audio/             # Ses dosyaları
│   │   └── temp/              # Geçici dosyalar
│   ├── tests/                 # Test dosyaları
│   │   ├── test_api.py
│   │   └── test_asr.py
│   ├── requirements.txt       # Python bağımlılıkları
│   └── README.md
│
└── frontend/                  # Next.js Frontend
    ├── app/                   # Next.js App Router
    │   ├── layout.tsx         # Root layout
    │   ├── globals.css        # Global CSS stilleri
    │   │
    │   ├── (public)/          # Public route group (korumasız sayfalar)
    │   │   ├── page.tsx       # Ana sayfa (landing)
    │   │   ├── login/
    │   │   │   └── page.tsx   # Giriş sayfası
    │   │   └── signup/
    │   │       └── page.tsx   # Kayıt sayfası
    │   │
    │   ├── (protected)/       # Protected route group (korunan sayfalar)
    │   │   ├── dashboard/
    │   │   │   ├── layout.tsx # Dashboard layout
    │   │   │   └── page.tsx   # Dashboard ana sayfa
    │   │   └── interview/
    │   │       ├── layout.tsx # Interview layout
    │   │       └── page.tsx   # Interview ana sayfa
    │   │
    │   ├── dashboard/         # Dashboard sayfaları (alternatif)
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   │
    │   └── interview/         # Interview sayfaları
    │       ├── page.tsx       # Interview ana sayfa
    │       ├── LivePanel.tsx  # Canlı panel komponenti
    │       ├── camera/
    │       │   └── CameraPreview.tsx  # Kamera önizleme
    │       └── webrtc/        # WebRTC modülleri
    │           ├── audioSender.ts      # Ses gönderme
    │           ├── signalingClient.ts  # Signaling istemcisi
    │           └── useWebRTC.ts        # WebRTC hook'u
    │
    ├── components/             # React komponentleri
    │   ├── interview/         # Mülakat komponentleri
    │   │   ├── AnalysisCard.tsx        # Analiz kartı
    │   │   ├── AudioMeter.tsx          # Ses seviyesi göstergesi
    │   │   ├── CameraPreview.tsx      # Kamera önizleme
    │   │   ├── LivePanel.tsx           # Canlı panel
    │   │   ├── LocalVideo.tsx           # Yerel video
    │   │   └── RemoteVideo.tsx         # Uzak video
    │   │
    │   ├── shared/            # Paylaşılan komponentler
    │   │   ├── ProtectedRoute.tsx      # Korumalı route wrapper
    │   │   ├── Sidebar.tsx             # Yan menü
    │   │   └── Topbar.tsx              # Üst menü
    │   │
    │   └── ui/                # UI komponentleri (shadcn/ui)
    │       ├── alert.tsx
    │       ├── avatar.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── navigation-menu.tsx
    │       └── textarea.tsx
    │
    ├── lib/                   # Yardımcı kütüphaneler
    │   ├── api.ts             # API istemci fonksiyonları
    │   ├── supabaseClient.ts  # Supabase istemci
    │   └── utils.ts           # Yardımcı fonksiyonlar
    │
    ├── public/                # Statik dosyalar
    │
    ├── package.json           # Node.js bağımlılıkları
    ├── package-lock.json
    ├── tsconfig.json          # TypeScript yapılandırması
    ├── tailwind.config.js     # Tailwind CSS yapılandırması
    ├── next.config.js         # Next.js yapılandırması
    ├── shadcn.json           # shadcn/ui yapılandırması
    ├── next-env.d.ts         # Next.js type tanımları
    └── README.md
```

## 📋 Klasör Açıklamaları

### Backend (`/backend`)

#### `/app/api/v1/`
- **audio_stream.py**: Ses akışı işlemleri (WebSocket, streaming)
- **auth.py**: Kimlik doğrulama (login, register, JWT)
- **candidates.py**: Aday CRUD işlemleri
- **interviews.py**: Mülakat yönetimi ve işlemleri
- **signaling.py**: WebRTC signaling server işlemleri

#### `/app/core/`
- **config.py**: Ortam değişkenleri ve yapılandırma
- **security.py**: JWT token işlemleri, şifre hashleme
- **utils.py**: Genel yardımcı fonksiyonlar

#### `/app/models/`
- **analysis_model.py**: Analiz sonuçları için Pydantic modelleri
- **interview_model.py**: Mülakat veri modelleri
- **user_model.py**: Kullanıcı veri modelleri

#### `/app/services/`
- **asr_service.py**: Otomatik Konuşma Tanıma (ASR) servisi
- **llm_service.py**: AI/LLM entegrasyonu (analiz, soru üretme)
- **report_service.py**: Mülakat raporu oluşturma
- **webrtc_service.py**: WebRTC bağlantı yönetimi

### Frontend (`/frontend`)

#### `/app/(public)/`
- Public (korumasız) sayfalar
- Route group: URL'de görünmez, sadece organizasyon için

#### `/app/(protected)/`
- Protected (korunan) sayfalar
- Authentication gerektiren sayfalar

#### `/app/interview/`
- Mülakat sayfaları ve WebRTC modülleri
- Canlı mülakat arayüzü

#### `/components/interview/`
- Mülakat özel komponentleri
- Video, ses, analiz komponentleri

#### `/components/shared/`
- Tüm sayfalarda kullanılan ortak komponentler
- Navigation, layout komponentleri

#### `/components/ui/`
- shadcn/ui komponentleri
- Temel UI elemanları (button, input, card, vb.)

#### `/lib/`
- API istemci fonksiyonları
- Supabase entegrasyonu
- Yardımcı utility fonksiyonları

## 🔄 Route Yapısı

### Public Routes
- `/` → `(public)/page.tsx`
- `/login` → `(public)/login/page.tsx`
- `/signup` → `(public)/signup/page.tsx`

### Protected Routes
- `/dashboard` → `(protected)/dashboard/page.tsx`
- `/interview` → `(protected)/interview/page.tsx`

## 🛠️ Teknolojiler

### Backend
- FastAPI
- Python
- WebRTC
- ASR (Automatic Speech Recognition)
- LLM/AI entegrasyonu

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- WebRTC
- Supabase (authentication)

## 📝 Notlar

1. **Route Groups**: `(public)` ve `(protected)` parantez içinde olduğu için URL'de görünmez, sadece organizasyon için kullanılır.

2. **Duplicate Routes**: Hem `(protected)/dashboard` hem de `dashboard/` var. Bu durum çözülmeli.

3. **Component Organization**: 
   - Interview-specific → `/components/interview/`
   - Shared → `/components/shared/`
   - UI primitives → `/components/ui/`

4. **WebRTC Structure**: WebRTC modülleri hem `/app/interview/webrtc/` hem de hook olarak kullanılabilir.

