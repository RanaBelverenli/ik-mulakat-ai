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
  userId: string
): Promise<UserRole> {
  try {
    // First, try to get role from profiles table (if it exists)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profileError && profile?.role) {
      const role = String(profile.role).toLowerCase().trim();
      if (role === "admin") {
        return "admin";
      }
      if (role === "user") {
        return "user";
      }
    }

    // If profiles table doesn't exist or no role found, check admins table
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.email) {
      const { data: adminRecord } = await supabase
        .from("admins")
        .select("email")
        .eq("email", user.user.email.toLowerCase())
        .maybeSingle();

      if (adminRecord) {
        return "admin";
      }
    }

    // Check user metadata as fallback
    if (user?.user) {
      const metadataRole =
        typeof user.user.user_metadata?.role === "string"
          ? user.user.user_metadata.role.toLowerCase().trim()
          : undefined;

      const appMetadataRoles = Array.isArray(user.user.app_metadata?.roles)
        ? user.user.app_metadata.roles.map((r: string) => String(r).toLowerCase().trim())
        : [];

      if (metadataRole === "admin" || appMetadataRoles.includes("admin")) {
        return "admin";
      }
    }

    // Default to 'user'
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[getUserRole] No role found for user ${userId}, defaulting to 'user'`
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

