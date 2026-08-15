"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

/** True when the browser has been given Supabase credentials. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Browser Supabase client. Returns null when the environment is not configured
 * so pages can render a setup notice instead of crashing.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/**
 * Ensures a usable auth session exists for a student, signing in anonymously on
 * first visit. The session is what links a device to its passport.
 *
 * getSession() only reads local storage, so a device can hold a token for a user
 * that no longer exists server-side (for example after test data is cleared).
 * That session looks valid but every write fails with a foreign key violation
 * against auth.users, so verify against the server and re-authenticate if stale.
 */
export async function ensureAnonymousSession(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data } = await supabase.auth.getSession();

  if (data.session?.user) {
    const { data: verified, error } = await supabase.auth.getUser();
    if (!error && verified.user) return verified.user.id;
    await supabase.auth.signOut().catch(() => {});
  }

  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return signedIn.user?.id ?? null;
}
