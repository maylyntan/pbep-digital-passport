import type { Passport } from "./types";
import { supabase } from "./supabase";

const STORAGE_KEY = "voice-passport-v1";

export function loadPassport(): Passport | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as Passport;
  } catch {
    return null;
  }
}

export function savePassport(passport: Passport) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
}

export function clearPassport() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function restorePassport(): Promise<Passport | null> {
  const local = loadPassport();
  if (local) return local;
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, student_code, class_name, created_at")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const passport: Passport = {
    id: data.id,
    firstName: data.first_name,
    studentId: data.student_code,
    className: data.class_name,
    createdAt: data.created_at,
  };

  savePassport(passport);
  return passport;
}

export async function createStudentPassport(input: {
  firstName: string;
  studentId: string;
  className: string;
}): Promise<{ passport: Passport | null; error: string | null }> {
  const nextPassport: Passport = {
    id: crypto.randomUUID(),
    firstName: input.firstName.trim(),
    studentId: input.studentId.trim(),
    className: input.className.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!nextPassport.firstName || !nextPassport.studentId || !nextPassport.className) {
    return { passport: null, error: "Please complete all three fields." };
  }

  if (supabase) {
    let { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError || !anonData.user) {
        return {
          passport: null,
          error: `Could not start a secure student session: ${anonError?.message || "Unknown error"}`,
        };
      }
      sessionData = { session: anonData.session };
    }

    const authUserId = sessionData.session?.user.id;
    if (!authUserId) {
      return { passport: null, error: "Could not identify this device session." };
    }

    // If this anonymous session already owns a student row, restore it rather than
    // creating a duplicate passport.
    const { data: existing } = await supabase
      .from("students")
      .select("id, first_name, student_code, class_name, created_at")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existing) {
      const restored: Passport = {
        id: existing.id,
        firstName: existing.first_name,
        studentId: existing.student_code,
        className: existing.class_name,
        createdAt: existing.created_at,
      };
      savePassport(restored);
      return { passport: restored, error: null };
    }

    const { error } = await supabase.from("students").insert({
      id: nextPassport.id,
      auth_user_id: authUserId,
      first_name: nextPassport.firstName,
      student_code: nextPassport.studentId,
      class_name: nextPassport.className,
    });

    if (error) {
      return { passport: null, error: `Could not create passport: ${error.message}` };
    }
  }

  savePassport(nextPassport);
  return { passport: nextPassport, error: null };
}
