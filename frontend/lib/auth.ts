import { supabase } from "./supabaseClient";
import { User, Session } from "@supabase/supabase-js";

/**
 * Kullanıcı oturumunu kontrol eder
 */
export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Mevcut kullanıcıyı getirir
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Kullanıcı çıkış yapar
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Kullanıcı giriş yapar
 */
export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Kullanıcı kayıt olur
 */
export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

/**
 * Auth state değişikliklerini dinler
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

