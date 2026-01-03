"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getUserRole } from "@/lib/roles";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        router.replace("/login");
        return;
      }

      // Wait for session to be written to storage
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      // Get user role and redirect accordingly
      const role = await getUserRole(supabase, session.user);
      const targetPath = role === "admin" ? "/dashboard" : "/interview-info";

      console.log(`[Auth Callback] User role determined: ${role}, redirecting to ${targetPath}`);

      setTimeout(() => {
        router.replace(targetPath);
      }, 200);
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700">
      <div className="text-white text-lg">Giriş doğrulanıyor...</div>
    </div>
  );
}

