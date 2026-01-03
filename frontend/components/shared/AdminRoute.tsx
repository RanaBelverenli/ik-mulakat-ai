"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_ADMIN_EMAILS = ["ranabelverenli@gmail.com"];

const getAdminEmails = () => {
  const rawEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (rawEnv && rawEnv.trim().length > 0) {
    return rawEnv
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
};

const isAdminUser = async (user: User | null) => {
  if (!user?.email) return false;

  const email = user.email.toLowerCase();
  const metadataRole =
    typeof user.user_metadata?.role === "string"
      ? user.user_metadata.role.toLowerCase()
      : undefined;
  const appMetadataRoles = Array.isArray(user.app_metadata?.roles)
    ? user.app_metadata.roles.map((role: string) => role.toLowerCase())
    : [];

  if (
    getAdminEmails().includes(email) ||
    metadataRole === "admin" ||
    appMetadataRoles.includes("admin")
  ) {
    return true;
  }

  const { data: adminRecord } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  return !!adminRecord;
};

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

      isAdminUser(session.user).then((allowed) => {
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


