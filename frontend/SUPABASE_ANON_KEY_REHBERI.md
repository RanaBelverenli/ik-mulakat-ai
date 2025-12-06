# Supabase Anon Key Nasıl Alınır?

## Adım Adım Rehber

### 1. Supabase Dashboard'a Giriş Yapın
- https://supabase.com/dashboard/project/ecwxwbznfqhysjkzzibm adresine gidin
- Giriş yapın (eğer giriş yapmadıysanız)

### 2. API Ayarlarına Gidin
- Sol menüden **Settings** (⚙️ Ayarlar) seçeneğine tıklayın
- Açılan alt menüden **API** seçeneğine tıklayın

### 3. Anon Key'i Kopyalayın
- Sayfada **Project API keys** bölümünü bulun
- **`anon` `public`** etiketli key'i bulun
- Key'in yanındaki **kopyala** (📋) butonuna tıklayın
- Bu key uzun bir string olacak (örnek: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 4. .env.local Dosyasını Düzenleyin
1. `frontend/.env.local` dosyasını bir metin editörü ile açın
2. Şu satırı bulun:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. `your-anon-key-here` kısmını silin ve kopyaladığınız anon key'i yapıştırın
4. Dosyayı kaydedin

### 5. Uygulamayı Yeniden Başlatın
```bash
# Terminal'de Ctrl+C ile durdurun, sonra:
cd frontend
npm run dev
```

### Örnek .env.local Dosyası
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ecwxwbznfqhysjkzzibm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd3h3YnpuZnFoeXNqa3p6aWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Önemli Notlar
- ⚠️ Anon key'i asla public repository'lere commit etmeyin
- ✅ `.env.local` dosyası zaten `.gitignore` içinde olmalı
- ✅ Key'i kopyalarken başında/sonunda boşluk olmamasına dikkat edin
- ✅ Key değişikliğinden sonra mutlaka uygulamayı yeniden başlatın

## Sorun Giderme
- **"Invalid API key" hatası**: Key'in doğru kopyalandığından ve `.env.local` dosyasında doğru yerde olduğundan emin olun
- **Key bulamıyorum**: Supabase Dashboard'da Settings → API sayfasında `anon` `public` etiketli key'i arayın
- **Hala çalışmıyor**: Terminal'de `npm run dev` komutunu durdurup tekrar başlatın

