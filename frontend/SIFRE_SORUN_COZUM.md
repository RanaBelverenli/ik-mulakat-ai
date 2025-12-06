# Şifre Giriş Sorunu Çözüm Rehberi

"Invalid login credentials" hatası alıyorsanız, aşağıdaki adımları deneyin:

## 1. Şifrenizi Kontrol Edin

- Büyük/küçük harf duyarlılığına dikkat edin
- Boşluk karakteri olmadığından emin olun
- Şifrenizi doğru yazdığınızdan emin olun

## 2. Şifrenizi Sıfırlayın

1. Login sayfasında **"Şifremi Unuttum"** linkine tıklayın
2. E-posta adresinizi girin
3. E-postanızı kontrol edin ve şifre sıfırlama linkine tıklayın
4. Yeni şifrenizi belirleyin
5. Yeni şifre ile giriş yapın

## 3. Kullanıcı Provider'ını Kontrol Edin

Eğer kullanıcınız **Google ile kayıt olmuşsa**, email/şifre ile giriş yapamazsınız:

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard/project/ecwxwbznfqhysjkzzibm

2. **Authentication → Users:**
   - Kullanıcınızı bulun
   - **"Identity"** sütununda provider'ı kontrol edin
   - Eğer **"google"** görüyorsanız, Google ile giriş yapmalısınız

3. **Çözüm:**
   - Login sayfasında **"Google ile Giriş Yap"** butonunu kullanın
   - VEYA Supabase Dashboard'dan kullanıcıya şifre atayın (yeni kullanıcı oluştur)

## 4. Email Doğrulamasını Kontrol Edin

1. **Supabase Dashboard → Authentication → Users:**
   - Kullanıcınızı bulun
   - **"Email Confirmed"** sütununu kontrol edin
   - Eğer **false** ise, email doğrulaması yapmanız gerekir

2. **Email Doğrulaması:**
   - Login sayfasında e-postanızı girin
   - "Yeni doğrulama e-postası gönder" butonuna tıklayın
   - E-postanızı kontrol edin ve doğrulama linkine tıklayın

## 5. Kullanıcıyı Yeniden Oluşturun

Eğer yukarıdaki çözümler işe yaramazsa:

1. **Supabase Dashboard → Authentication → Users:**
   - Mevcut kullanıcıyı silin (veya yeni bir email ile kayıt olun)

2. **Yeni kullanıcı oluşturun:**
   - `/signup` sayfasından yeni bir hesap oluşturun
   - Email doğrulamasını yapın
   - Giriş yapın

## 6. Supabase Ayarlarını Kontrol Edin

1. **Supabase Dashboard → Authentication → Settings:**
   - **"Enable email confirmations"** ayarını kontrol edin
   - Test için kapatabilirsiniz (güvenlik riski oluşturabilir)

2. **Password Policy:**
   - Minimum şifre uzunluğunu kontrol edin
   - Şifre gereksinimlerini kontrol edin

## Hızlı Test

1. **Yeni bir test kullanıcısı oluşturun:**
   - `/signup` sayfasından
   - Basit bir email ve şifre ile

2. **Giriş yapmayı deneyin:**
   - Eğer yeni kullanıcı ile giriş yapabiliyorsanız, eski kullanıcıda sorun var demektir

3. **Eski kullanıcıyı kontrol edin:**
   - Supabase Dashboard'dan kullanıcı detaylarını inceleyin
   - Provider, email confirmed, last sign in gibi bilgileri kontrol edin

## Destek

Sorun devam ederse:
- Supabase Dashboard'dan kullanıcı bilgilerini kontrol edin
- Console'da hata mesajlarını kontrol edin
- Browser'ın Developer Tools → Network sekmesinde API isteklerini kontrol edin

