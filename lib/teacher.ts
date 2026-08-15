"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { getSupabase } from "./supabase-client";

export type TeacherStatus =
  | "loading"
  | "unconfigured"
  | "signed-out"
  | "not-teacher"
  | "teacher";

export interface TeacherSession {
  supabase: SupabaseClient | null;
  status: TeacherStatus;
  session: Session | null;
  refresh: () => void;
}

/**
 * Resolves whether the current session belongs to a facilitator. Anonymous
 * student sessions count as signed out for the teacher area.
 */
export function useTeacherSession(): TeacherSession {
  const [supabase] = useState<SupabaseClient | null>(() => getSupabase());
  const [status, setStatus] = useState<TeacherStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const current = data.session;
      if (!active) return;

      setSession(current);

      if (!current?.user || current.user.is_anonymous) {
        setStatus("signed-out");
        return;
      }

      const { data: profile } = await supabase
        .from("teacher_profiles")
        .select("user_id")
        .eq("user_id", current.user.id)
        .maybeSingle();

      if (!active) return;
      setStatus(profile ? "teacher" : "not-teacher");
    })();

    return () => {
      active = false;
    };
  }, [supabase, tick]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => refresh());
    return () => data.subscription.unsubscribe();
  }, [supabase, refresh]);

  return { supabase, status, session, refresh };
}
