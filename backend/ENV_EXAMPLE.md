# Backend Environment Variables

Backend için gerekli environment variable'lar:

## Gerekli Değişkenler

```env
# Gemini API Key (STT için)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL (CORS için)
FRONTEND_URL=https://ik-mulakat-ai.vercel.app
```

## Gemini API Key Alma

1. https://aistudio.google.com/app/apikey adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API Key'i kopyalayın
5. Render'da veya lokal `.env` dosyasına ekleyin

## Render'da Environment Variables Ekleme

1. Render Dashboard → Projeniz → Environment
2. "Add Environment Variable" butonuna tıklayın
3. Aşağıdaki değişkenleri ekleyin:
   - `GEMINI_API_KEY` = Gemini API Key'iniz
   - `FRONTEND_URL` = Vercel frontend URL'iniz (opsiyonel)

## Lokal Geliştirme

`backend/.env` dosyası oluşturun:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
```

## Test

Gemini STT'nin çalıştığını test etmek için:

```bash
cd backend
python tests/test_gemini_stt.py
```

**Not:** Test için `backend/data/audio/test.webm` dosyası gerekir.

