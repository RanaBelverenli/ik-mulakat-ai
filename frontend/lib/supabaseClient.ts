import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === "your-anon-key-here") {
  console.error(
    "❌ Supabase yapılandırması eksik!\n" +
    "Lütfen .env.local dosyasını düzenleyin:\n" +
    "1. Supabase Dashboard'a gidin: https://supabase.com/dashboard/project/ecwxwbznfqhysjkzzibm\n" +
    "2. Settings → API → anon public key'i kopyalayın\n" +
    "3. .env.local dosyasındaki NEXT_PUBLIC_SUPABASE_ANON_KEY değerini güncelleyin"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce", // PKCE flow kullan (daha güvenli)
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "apikey": supabaseAnonKey,
        },
      }).catch((error) => {
        console.error("Supabase fetch hatası:", error);
        throw error;
      });
    },
  },
});

