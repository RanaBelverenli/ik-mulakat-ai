"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setAuthenticated(true);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setAuthenticated(false);
        router.push("/login");
      } else if (!session) {
        setAuthenticated(false);
        router.push("/login");
      } else {
        setAuthenticated(true);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}

