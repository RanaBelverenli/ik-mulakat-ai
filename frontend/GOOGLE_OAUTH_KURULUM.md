# Google OAuth Kurulum Rehberi

Google ile giriş özelliğini aktifleştirmek için aşağıdaki adımları izleyin.

## 1. Google Cloud Console'da Proje Oluşturun

1. **Google Cloud Console'a gidin:**
   - https://console.cloud.google.com/

2. **Yeni proje oluşturun:**
   - Üst menüden proje seçin → "New Project"
   - Proje adı: "AI Interview Assistant" (veya istediğiniz bir isim)
   - "Create" butonuna tıklayın

## 2. OAuth 2.0 Credentials Oluşturun

1. **API & Services → Credentials:**
   - Sol menüden **APIs & Services** → **Credentials** seçin

2. **OAuth consent screen'i yapılandırın:**
   - **OAuth consent screen** sekmesine gidin
   - **User Type:** External seçin → **Create**
   - **App information:**
     - App name: "AI Interview Assistant"
     - User support email: E-posta adresiniz
     - Developer contact: E-posta adresiniz
   - **Save and Continue** butonuna tıklayın
   - **Scopes:** Varsayılan ayarları kullanın → **Save and Continue**
   - **Test users:** Şimdilik atlayın → **Save and Continue**
   - **Summary:** Gözden geçirin → **Back to Dashboard**

3. **OAuth 2.0 Client ID oluşturun:**
   - **Credentials** sekmesine geri dönün
   - **+ CREATE CREDENTIALS** → **OAuth client ID** seçin
   - **Application type:** Web application seçin
   - **Name:** "AI Interview Assistant Web Client"
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (development için)
     - `https://yourdomain.com` (production için - varsa)
   - **Authorized redirect URIs:**
     - `https://ecwxwbznfqhysjkzzibm.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (development için)
   - **Create** butonuna tıklayın

4. **Client ID ve Client Secret'i kopyalayın:**
   - Açılan popup'ta **Client ID** ve **Client Secret** değerlerini kopyalayın
   - Bu değerleri güvenli bir yere kaydedin

## 3. Supabase'de Google Provider'ı Yapılandırın

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard/project/ecwxwbznfqhysjkzzibm

2. **Authentication → Providers:**
   - Sol menüden **Authentication** → **Providers** seçin

3. **Google provider'ı aktifleştirin:**
   - **Google** provider'ını bulun
   - **Enable Google provider** toggle'ını açın

4. **Google credentials'ları ekleyin:**
   - **Client ID (for OAuth):** Google Cloud Console'dan kopyaladığınız Client ID'yi yapıştırın
   - **Client Secret (for OAuth):** Google Cloud Console'dan kopyaladığınız Client Secret'i yapıştırın

5. **Save** butonuna tıklayın

## 4. Redirect URL'leri Kontrol Edin

Supabase otomatik olarak redirect URL'i ayarlar, ancak kontrol etmek için:

1. **Authentication → URL Configuration:**
   - **Site URL:** `http://localhost:3000` (development için)
   - **Redirect URLs:** Şu URL'lerin eklendiğinden emin olun:
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback` (production için)

## 5. Test Edin

1. **Uygulamayı başlatın:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login sayfasına gidin:**
   - `http://localhost:3000/login`

3. **"Google ile Giriş Yap" butonuna tıklayın:**
   - Google hesabınızı seçin
   - İzinleri onaylayın
   - Dashboard'a yönlendirilmelisiniz

## Sorun Giderme

### "redirect_uri_mismatch" hatası:
- Google Cloud Console'da **Authorized redirect URIs** listesini kontrol edin
- Supabase callback URL'i eklediğinizden emin olun: `https://ecwxwbznfqhysjkzzibm.supabase.co/auth/v1/callback`

### "OAuth consent screen" hatası:
- Google Cloud Console'da OAuth consent screen'i tamamladığınızdan emin olun
- Test kullanıcıları eklemeniz gerekebilir (development için)

### "Invalid client" hatası:
- Client ID ve Client Secret'in doğru kopyalandığından emin olun
- Supabase'de Google provider ayarlarını kontrol edin

### Callback sayfası çalışmıyor:
- `frontend/app/auth/callback/route.ts` dosyasının doğru oluşturulduğundan emin olun
- Next.js server'ı yeniden başlatın

## Production için Notlar

Production'a geçerken:
1. Google Cloud Console'da production domain'inizi ekleyin
2. Supabase'de production redirect URL'lerini ekleyin
3. OAuth consent screen'i production için yayınlayın (Google onayı gerekebilir)

