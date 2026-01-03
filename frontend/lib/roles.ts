/**
 * Role-based authentication helper
 * Single source of truth for user roles
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "user";

/**
 * Get user role from database
 * Checks profiles table first, then admins table as fallback
 * Returns 'user' by default if no role found
 */
export async function getUserRole(
  supabase: SupabaseClient,
  user: User | { id: string; email?: string | null; user_metadata?: any; app_metadata?: any }
): Promise<UserRole> {
  try {
    const userId = typeof user === "string" ? user : user.id;
    const userEmail = typeof user === "string" ? null : user.email;

    // First, try to get role from profiles table (if it exists)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profileError && profile?.role) {
      const role = String(profile.role).toLowerCase().trim();
      if (role === "admin") {
        console.log(`[getUserRole] Admin role found in profiles table for user ${userId}`);
        return "admin";
      }
      if (role === "user") {
        return "user";
      }
    }

    // If profiles table doesn't exist or no role found, check admins table
    if (userEmail) {
      const { data: adminRecord, error: adminError } = await supabase
        .from("admins")
        .select("email")
        .eq("email", userEmail.toLowerCase())
        .maybeSingle();

      if (adminError && adminError.code !== "PGRST116") {
        console.warn("[getUserRole] Error checking admins table:", adminError.message);
      }

      if (adminRecord) {
        console.log(`[getUserRole] Admin found in admins table for email ${userEmail}`);
        return "admin";
      }
    }

    // Check user metadata as fallback
    if (typeof user !== "string") {
      const metadataRole =
        typeof user.user_metadata?.role === "string"
          ? user.user_metadata.role.toLowerCase().trim()
          : undefined;

      const appMetadataRoles = Array.isArray(user.app_metadata?.roles)
        ? user.app_metadata.roles.map((r: string) => String(r).toLowerCase().trim())
        : [];

      if (metadataRole === "admin" || appMetadataRoles.includes("admin")) {
        console.log(`[getUserRole] Admin role found in metadata for user ${userId}`);
        return "admin";
      }
    }

    // Check environment variable admin emails as last fallback
    const DEFAULT_ADMIN_EMAILS = ["ranabelverenli@gmail.com"];
    const rawEnvAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    const ADMIN_EMAILS = (
      rawEnvAdmins && rawEnvAdmins.trim().length > 0
        ? rawEnvAdmins.split(",")
        : DEFAULT_ADMIN_EMAILS
    )
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      console.log(`[getUserRole] Admin email found in env variable for ${userEmail}`);
      return "admin";
    }

    // Default to 'user'
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[getUserRole] No admin role found for user ${userId} (${userEmail || "no email"}), defaulting to 'user'`
      );
    }

    return "user";
  } catch (error) {
    console.error("[getUserRole] Error fetching user role:", error);
    return "user";
  }
}

/**
 * Check if user is admin
 */
export async function isAdminUser(
  supabase: SupabaseClient,
  user: User | null
): Promise<boolean> {
  if (!user?.id) return false;

  const role = await getUserRole(supabase, user.id);
  return role === "admin";
}

