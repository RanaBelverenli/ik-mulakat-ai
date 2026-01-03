"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"user" | "admin">("user");
  
  // Supabase yapılandırmasını kontrol et
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseAnonKey !== "your-anon-key-here";
  const DEFAULT_ADMIN_EMAILS = ["ranabelverenli@gmail.com"];
  const rawEnvAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  const ADMIN_EMAILS = (
    rawEnvAdmins && rawEnvAdmins.trim().length > 0
      ? rawEnvAdmins.split(",")
      : DEFAULT_ADMIN_EMAILS
  )
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const router = useRouter();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Supabase giriş hatası:", signInError);
        // Network/Fetch hatası kontrolü
        if (signInError.message?.includes("Failed to fetch") || signInError.message?.includes("NetworkError") || signInError.status === 0) {
          setError(
            "Bağlantı hatası: Supabase servisine bağlanılamıyor. " +
            "Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin. " +
            "Eğer sorun devam ederse, Supabase URL ve API key yapılandırmanızı kontrol edin."
          );
        } else if (signInError.message.includes("Email not confirmed") || signInError.message.includes("email_not_confirmed")) {
          setError("E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin veya yeni doğrulama e-postası gönderin.");
        } else if (signInError.message.includes("Invalid login credentials") || signInError.message.includes("invalid_credentials")) {
          setError(
            "E-posta veya şifre hatalı. " +
            "Eğer şifrenizi unuttuysanız 'Şifremi Unuttum' linkini kullanabilirsiniz. " +
            "Kullanıcınız Google ile kayıt olmuşsa 'Google ile Giriş Yap' butonunu kullanın."
          );
        } else {
          setError(signInError.message || "Giriş yapılırken bir hata oluştu.");
        }
        setLoading(false);
        return;
      }

      const userEmail = data.user?.email?.toLowerCase() ?? "";
      const metadataRole =
        typeof data.user?.user_metadata?.role === "string"
          ? data.user.user_metadata.role.toLowerCase()
          : undefined;
      const appMetadataRoles = Array.isArray(data.user?.app_metadata?.roles)
        ? data.user.app_metadata.roles.map((role: string) => role.toLowerCase())
        : [];

      let dbAdminMatch = false;
      if (loginType === "admin") {
        try {
          const { data: adminRecord, error: adminError } = await supabase
            .from("admins")
            .select("email")
            .eq("email", userEmail)
            .maybeSingle();

          if (adminError && adminError.code !== "PGRST116") {
            console.warn("Admin kontrolü sırasında hata:", adminError.message);
          }

          dbAdminMatch = !!adminRecord;
        } catch (dbError) {
          console.warn("Admin tablosu kontrol edilirken hata oluştu:", dbError);
        }
      }

      const isAdminUser =
        ADMIN_EMAILS.includes(userEmail) ||
        metadataRole === "admin" ||
        appMetadataRoles.includes("admin") ||
        dbAdminMatch;

      if (loginType === "admin") {
        if (!isAdminUser) {
          setError(
            "Giriş başarısız. Bu hesap admin olarak yetkilendirilmemiş."
          );
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }

      // Get user role and redirect accordingly
      if (data.user && data.session) {
        // Import getUserRole dynamically to avoid circular dependencies
        const { getUserRole } = await import("@/lib/roles");
        const role = await getUserRole(supabase, data.user.id);
        
        // Determine target path based on role
        const targetPath = role === "admin" ? "/dashboard" : "/interview-info";
        
        // Use router.replace to avoid back button issues
        router.replace(targetPath);
        return;
      } else if (data.user) {
        // Session not ready yet, wait for it
        let attempts = 0;
        const maxAttempts = 10;
        
        const interval = setInterval(async () => {
          attempts++;
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            clearInterval(interval);
            const { getUserRole } = await import("@/lib/roles");
            const role = await getUserRole(supabase, data.user.id);
            const targetPath = role === "admin" ? "/dashboard" : "/interview-info";
            router.replace(targetPath);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            setError("Giriş yapıldı ancak oturum başlatılamadı. Lütfen tekrar deneyin.");
            setLoading(false);
          }
        }, 200);
        
        return;
      } else {
        setError("Giriş başarısız. Lütfen tekrar deneyin.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Giriş hatası:", err);
      // Network hatası kontrolü
      if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError") || err?.code === "ECONNREFUSED") {
        setError(
          "Bağlantı hatası: Supabase servisine bağlanılamıyor. " +
          "Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin. " +
          "Eğer sorun devam ederse, Supabase yapılandırmanızı kontrol edin."
        );
      } else if (err?.message) {
        setError(`Hata: ${err.message}`);
      } else {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Lütfen e-posta adresinizi girin.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setSuccessMessage("Doğrulama e-postası gönderildi! Lütfen e-postanızı kontrol edin.");
      }
    } catch (err) {
      setError("E-posta gönderilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      }
      // OAuth redirect otomatik olarak gerçekleşecek, bu yüzden burada bir şey yapmamıza gerek yok
    } catch (err) {
      setError("Google ile giriş yapılırken bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700 flex flex-col relative overflow-hidden">
      <header className="w-full px-6 md:px-12 py-6 z-10">
        <div className="w-full max-w-7xl mx-auto flex items-center">
          <h1 className="text-xl md:text-2xl font-semibold text-white">AI Mülakat Asistanı</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-16 py-8 md:py-12 relative z-10">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-white space-y-6 md:space-y-8">
          <div className="w-full text-center space-y-6 md:space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
              AI Mülakat Asistanı
            </h2>
            
            <p className="text-lg md:text-xl text-white/95 leading-relaxed">
              Gerçek zamanlı yapay zekâ destekli mülakat analiz sistemi
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full max-w-md mx-auto space-y-4 mt-4">
            <div className="bg-white/10 border border-white/20 rounded-lg p-2 flex items-center gap-2 text-sm font-medium">
              <button
                type="button"
                onClick={() => setLoginType("user")}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  loginType === "user"
                    ? "bg-white text-purple-600"
                    : "text-white/80 hover:bg-white/10"
                }`}
                disabled={loading}
              >
                Kullanıcı Girişi
              </button>
              <button
                type="button"
                onClick={() => setLoginType("admin")}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  loginType === "admin"
                    ? "bg-white text-purple-600"
                    : "text-white/80 hover:bg-white/10"
                }`}
                disabled={loading}
              >
                Admin Girişi
              </button>
            </div>

            {!isSupabaseConfigured && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">⚠️ Supabase yapılandırması eksik!</p>
                    <p className="text-sm">
                      Lütfen .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini ayarlayın.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{error}</p>
                    {error.includes("doğrulanmamış") && (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        className="text-sm underline hover:no-underline"
                      >
                        Yeni doğrulama e-postası gönder
                      </button>
                    )}
                    {error.includes("E-posta veya şifre hatalı") && (
                      <div className="flex flex-col gap-2 mt-2">
                        <Link
                          href="/forgot-password"
                          className="text-sm underline hover:no-underline"
                        >
                          Şifremi Unuttum
                        </Link>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="bg-green-500/20 border-green-500/50 text-white">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 h-12 rounded-lg backdrop-blur-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Şifreniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 h-12 rounded-lg backdrop-blur-sm"
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-white/80 hover:text-white underline"
                >
                  Şifremi Unuttum
                </Link>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 pt-2 ${loginType === "admin" ? "sm:flex-none" : ""}`}>
              <Button
                type="submit"
                disabled={loading}
                className={`bg-white text-purple-600 hover:bg-gray-100 border border-purple-300 rounded-lg px-6 py-3 text-base font-medium ${
                  loginType === "admin" ? "w-full" : "flex-1"
                }`}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
              {loginType === "user" && (
                <Link href="/signup" className="flex-1">
                  <Button
                    type="button"
                    className="bg-purple-600 text-white hover:bg-purple-700 border-0 rounded-lg px-6 py-3 text-base font-medium w-full"
                  >
                    Kayıt Ol
                  </Button>
                </Link>
              )}
            </div>

            {loginType === "user" && (
              <>
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-white/70">veya</span>
                  </div>
                </div>

                {/* Google Login Button */}
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg px-6 py-3 text-base font-medium flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google ile Giriş Yap
                </Button>
              </>
            )}
          </form>
        </div>
      </main>

    </div>
  );
}

