"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAdminUser } from "@/lib/roles";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!session?.user) {
        setAuthorized(false);
        return;
      }

      isAdminUser(supabase, session.user).then((allowed) => {
        setAuthorized(allowed);
      });
    }
  }, [loading, session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!session) {
    router.replace("/login");
    return null;
  }

  if (!authorized) {
    router.replace("/interview-info");
    return null;
  }

  return <>{children}</>;
}


