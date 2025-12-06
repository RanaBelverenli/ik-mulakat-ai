"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700 flex flex-col relative overflow-hidden">
      <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between z-10">
        <h1 className="text-xl md:text-2xl font-semibold text-white">AI Mülakat Asistanı</h1>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="bg-white text-purple-600 hover:bg-gray-100 border border-purple-300 rounded-lg px-4 md:px-6 py-2 text-sm md:text-base font-medium">
              Giriş Yap
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-purple-600 text-white hover:bg-purple-700 border-0 rounded-lg px-4 md:px-6 py-2 text-sm md:text-base font-medium">
              Kayıt Ol
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-16 py-8 md:py-12 relative z-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-white text-center space-y-6 md:space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
            Şifremi Unuttum
          </h2>

          <p className="text-lg md:text-xl text-white/95 leading-relaxed max-w-xl"></p>

          {success ? (
            <div className="w-full max-w-md space-y-4 mt-4">
              <Alert className="bg-green-500/20 border-green-500/50 text-white">
                <AlertDescription>
                  Şifre sıfırlama linki e-posta adresinize gönderildi! Lütfen e-postanızı kontrol edin.
                </AlertDescription>
              </Alert>
              <Link href="/login">
                <Button className="bg-white text-purple-600 hover:bg-gray-100 border border-purple-300 rounded-lg px-6 py-3 text-base font-medium w-full">
                  Giriş Sayfasına Dön
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="w-full max-w-md space-y-4 mt-4 text-left">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                  <AlertDescription>{error}</AlertDescription>
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

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-purple-600 hover:bg-gray-100 border border-purple-300 rounded-lg px-6 py-3 text-base font-medium w-full"
                >
                  {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
                </Button>
                <Link href="/login">
                  <Button
                    type="button"
                    className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 rounded-lg px-6 py-3 text-base font-medium w-full"
                  >
                    Geri Dön
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

