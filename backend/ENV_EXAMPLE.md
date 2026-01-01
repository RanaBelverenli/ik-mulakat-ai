# Backend Environment Variables

Backend için gerekli environment variable'lar:

## Gerekli Değişkenler

```env
# OpenAI API Key (STT için - Whisper)
OPENAI_API_KEY=your_openai_api_key_here

# Whisper Model (opsiyonel, varsayılan: whisper-1)
WHISPER_MODEL_NAME=whisper-1

# Frontend URL (CORS için)
FRONTEND_URL=https://ik-mulakat-ai.vercel.app
```

## OpenAI API Key Alma

1. https://platform.openai.com/api-keys adresine gidin
2. OpenAI hesabınızla giriş yapın
3. "Create new secret key" butonuna tıklayın
4. API Key'i kopyalayın (sadece bir kez gösterilir!)
5. Render'da veya lokal `.env` dosyasına ekleyin

## Render'da Environment Variables Ekleme

1. Render Dashboard → Projeniz → Environment
2. "Add Environment Variable" butonuna tıklayın
3. Aşağıdaki değişkenleri ekleyin:
   - `OPENAI_API_KEY` = OpenAI API Key'iniz (ZORUNLU)
   - `WHISPER_MODEL_NAME` = whisper-1 (opsiyonel, varsayılan değer)
   - `FRONTEND_URL` = Vercel frontend URL'iniz (opsiyonel)

## Lokal Geliştirme

`backend/.env` dosyası oluşturun:

```env
OPENAI_API_KEY=your_openai_api_key_here
WHISPER_MODEL_NAME=whisper-1
FRONTEND_URL=http://localhost:3000
```

## Test

Whisper STT'nin çalıştığını test etmek için:

```bash
cd backend
python -c "from services.whisper_stt import transcribe_with_whisper_chunk; import asyncio; asyncio.run(transcribe_with_whisper_chunk(open('data/audio/test.webm', 'rb').read()))"
```

**Not:** Test için `backend/data/audio/test.webm` dosyası gerekir.

