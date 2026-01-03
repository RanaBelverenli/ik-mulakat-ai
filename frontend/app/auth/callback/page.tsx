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
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error("[Auth Callback] OAuth exchange hatası:", error);
          router.replace("/login?error=auth_failed");
          return;
        }

        if (!data?.session?.user) {
          console.error("[Auth Callback] Session oluşturulamadı");
          router.replace("/login?error=no_session");
          return;
        }

        // Kullanıcının admin olup olmadığını kontrol et
        const user = data.session.user;
        const userEmail = user.email?.toLowerCase() ?? "";
        const DEFAULT_ADMIN_EMAILS = ["ranabelverenli@gmail.com"];
        const rawEnvAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
        const ADMIN_EMAILS = (
          rawEnvAdmins && rawEnvAdmins.trim().length > 0
            ? rawEnvAdmins.split(",")
            : DEFAULT_ADMIN_EMAILS
        )
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean);

        const metadataRole =
          typeof user.user_metadata?.role === "string"
            ? user.user_metadata.role.toLowerCase()
            : undefined;
        const appMetadataRoles = Array.isArray(user.app_metadata?.roles)
          ? user.app_metadata.roles.map((role: string) => role.toLowerCase())
          : [];

        let dbAdminMatch = false;
        try {
          const { data: adminRecord, error: adminError } = await supabase
            .from("admins")
            .select("email")
            .eq("email", userEmail)
            .maybeSingle();

          if (adminError && adminError.code !== "PGRST116") {
            console.warn("[Auth Callback] Admin kontrolü sırasında hata:", adminError.message);
          }

          dbAdminMatch = !!adminRecord;
        } catch (dbError) {
          console.warn("[Auth Callback] Admin tablosu kontrol edilirken hata oluştu:", dbError);
        }

        const isAdminUser =
          ADMIN_EMAILS.includes(userEmail) ||
          metadataRole === "admin" ||
          appMetadataRoles.includes("admin") ||
          dbAdminMatch;

        // Kullanıcı tipine göre yönlendir
        const targetPath = isAdminUser ? "/dashboard" : "/interview-info";
        console.log("[Auth Callback] Kullanıcı yönlendiriliyor:", { email: userEmail, isAdmin: isAdminUser, targetPath });
        router.replace(targetPath);
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

