# Email Doğrulamasını Kapatma (Hızlı Çözüm)

"Email not confirmed" hatası alıyorsanız, test için email doğrulamasını kapatabilirsiniz.

## Adımlar:

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard/project/ecwxwbznfqhysjkzzibm

2. **Authentication ayarlarına gidin:**
   - Sol menüden **Authentication** (🔐) seçeneğine tıklayın
   - Açılan alt menüden **Settings** (⚙️) seçeneğine tıklayın

3. **Email doğrulamasını kapatın:**
   - Sayfada **"Enable email confirmations"** veya **"Confirm email"** seçeneğini bulun
   - Bu seçeneği **KAPATIN** (toggle'ı kapatın)

4. **Kaydedin:**
   - Değişiklikler otomatik olarak kaydedilir

5. **Test edin:**
   - Yeni bir kullanıcı oluşturun veya mevcut kullanıcı ile giriş yapmayı deneyin
   - Artık email doğrulaması olmadan giriş yapabilmelisiniz

## Önemli Notlar:

⚠️ **Güvenlik Uyarısı:** Email doğrulamasını kapatmak, üretim ortamında güvenlik riski oluşturabilir. Bu ayarı sadece test/development için kullanın.

✅ **Alternatif:** Email doğrulamasını açık tutmak istiyorsanız:
- Kayıt olduktan sonra e-postanızı kontrol edin
- Doğrulama linkine tıklayın
- Sonra giriş yapabilirsiniz

## Mevcut Kullanıcılar İçin:

Eğer zaten kayıt olduysanız ve email doğrulaması yapmadıysanız:

1. **Login sayfasında** e-posta adresinizi girin
2. "Yeni doğrulama e-postası gönder" butonuna tıklayın
3. E-postanızı kontrol edin ve doğrulama linkine tıklayın

VEYA

1. Supabase Dashboard → **Authentication** → **Users**
2. Kullanıcınızı bulun
3. **"Confirm email"** veya **"Verify"** butonuna tıklayın (manuel doğrulama)

