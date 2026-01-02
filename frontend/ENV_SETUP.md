# Environment Variables Setup

## Vercel (Frontend) Environment Variables

Aşağıdaki environment variable'ları Vercel Dashboard'da set edilmelidir:

### Required Variables

```
NEXT_PUBLIC_API_URL=https://ik-mulakat-ai.onrender.com
```

**Not:** Trailing slash (`/`) olmamalı. Helper fonksiyon otomatik olarak temizler.

### Setup Steps

1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. Settings → Environment Variables
4. `NEXT_PUBLIC_API_URL` ekleyin:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://ik-mulakat-ai.onrender.com`
   - **Environment:** Production, Preview, Development (hepsinde)
5. Save
6. Redeploy (otomatik olarak yeni commit'lerde deploy edilir)

### Verification

Deploy sonrası browser console'da (F12):
```javascript
console.log('[Backend URL]', process.env.NEXT_PUBLIC_API_URL);
```

Production'da `https://ik-mulakat-ai.onrender.com` görünmeli.

## Render (Backend) Environment Variables

Backend için gerekli environment variables:

```
GEMINI_API_KEY=your_gemini_api_key
GEMINI_REPORT_MODEL=gemini-2.5-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key  # Whisper STT için
```

