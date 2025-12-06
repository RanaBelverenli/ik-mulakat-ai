# Supabase Kurulum Rehberi

## 1. Supabase Anon Key'i Alın

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard/project/ecwxwbznfqhysjkzzibm
2. Sol menüden **Settings** (Ayarlar) → **API** seçin
3. **Project API keys** bölümünde **`anon` `public`** key'i kopyalayın
4. Bu key'i `.env.local` dosyasındaki `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerine yapıştırın

## 2. .env.local Dosyasını Düzenleyin

`frontend/.env.local` dosyasını açın ve şu şekilde düzenleyin:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ecwxwbznfqhysjkzzibm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya-anon-key-yapistirin
```

## 3. İlk Kullanıcıyı Oluşturun

### Yöntem 1: Supabase Dashboard'dan
1. Supabase Dashboard → **Authentication** → **Users**
2. **Add user** → **Create new user** butonuna tıklayın
3. Email ve password girin
4. Kullanıcıyı oluşturun

### Yöntem 2: Uygulama Üzerinden
1. Uygulamayı çalıştırın: `npm run dev`
2. `/signup` sayfasına gidin
3. Email ve password ile kayıt olun
4. Email doğrulaması gerekebilir (Supabase ayarlarına bağlı)

## 4. Email Doğrulamasını Ayarlayın (Opsiyonel)

Eğer email doğrulaması istemiyorsanız:
1. Supabase Dashboard → **Authentication** → **Settings**
2. **Enable email confirmations** seçeneğini kapatın

## 5. Uygulamayı Test Edin

1. Development server'ı başlatın:
```bash
cd frontend
npm run dev
```

2. Tarayıcıda `http://localhost:3000` adresine gidin
3. `/login` sayfasına gidin ve oluşturduğunuz kullanıcı ile giriş yapın

## Sorun Giderme

- **"Supabase URL veya Anon Key bulunamadı" hatası**: `.env.local` dosyasının doğru dizinde olduğundan ve değerlerin doğru girildiğinden emin olun
- **"Invalid API key" hatası**: Anon key'in doğru kopyalandığından emin olun
- **"Email verification required" hatası**: Supabase Dashboard'dan email doğrulamasını kapatın veya email'inizi doğrulayın

