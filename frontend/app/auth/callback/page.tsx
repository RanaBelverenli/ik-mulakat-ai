"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // OAuth callback URL'den code'u al ve session'a çevir
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error("[Auth Callback] OAuth exchange hatası:", error);
          router.replace("/login?error=auth_failed");
          return;
        }

        // Session'ın hydrate edilmesini bekle
        await supabase.auth.getSession();

        // Kısa bir delay ekle (session hydration için)
        setTimeout(() => {
          router.replace("/dashboard");
        }, 100);
      } catch (err) {
        console.error("[Auth Callback] Beklenmeyen hata:", err);
        router.replace("/login?error=unexpected");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700">
      <div className="text-white text-lg">Giriş doğrulanıyor...</div>
    </div>
  );
}

