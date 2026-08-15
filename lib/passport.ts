"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CheckinRow, LearningRecord, StampRow, StudentRow } from "./types";

export interface PassportSnapshot {
  student: StudentRow;
  stamps: StampRow[];
  checkins: CheckinRow[];
}

/** Loads the passport linked to the current auth session, if one exists. */
export async function loadPassport(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<PassportSnapshot | null> {
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<StudentRow>();

  if (error || !student) return null;

  const [stamps, checkins] = await Promise.all([
    supabase
      .from("stamps")
      .select("*")
      .eq("student_id", student.id)
      .order("confirmed_at", { ascending: true }),
    supabase
      .from("checkin_requests")
      .select("*")
      .eq("student_id", student.id)
      .order("requested_at", { ascending: true }),
  ]);

  return {
    student,
    stamps: (stamps.data as StampRow[] | null) ?? [],
    checkins: (checkins.data as CheckinRow[] | null) ?? [],
  };
}

export interface RegistrationInput {
  studentName: string;
  studentId: string;
  className: string;
}

export async function registerPassport(
  supabase: SupabaseClient,
  authUserId: string,
  input: RegistrationInput,
): Promise<StudentRow> {
  const payload = {
    auth_user_id: authUserId,
    student_name: input.studentName.trim().slice(0, 80),
    student_id: input.studentId.trim() ? input.studentId.trim().slice(0, 40) : null,
    class_name: input.className.trim().toUpperCase().slice(0, 40),
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("*")
    .single<StudentRow>();

  if (error) throw new Error(error.message);
  return data;
}

/** Asks a facilitator to confirm this booth. One pending row per booth. */
export async function requestCheckin(
  supabase: SupabaseClient,
  studentId: string,
  boothSlug: string,
): Promise<CheckinRow> {
  const { data, error } = await supabase
    .from("checkin_requests")
    .insert({ student_id: studentId, booth_slug: boothSlug, status: "pending" })
    .select("*")
    .single<CheckinRow>();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveLearningRecord(
  supabase: SupabaseClient,
  studentId: string,
  record: LearningRecord,
): Promise<StudentRow> {
  const { data, error } = await supabase
    .from("students")
    .update({
      reflection: record.reflection.trim() || null,
      new_vocabulary: record.new_vocabulary.trim() || null,
      favourite_booth: record.favourite_booth.trim() || null,
      speaking_goal: record.speaking_goal.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .select("*")
    .single<StudentRow>();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Unlinks this device from its passport and starts a fresh anonymous session.
 * The previous record stays in the database for the teacher dashboard.
 */
export async function startNewPassport(supabase: SupabaseClient): Promise<string | null> {
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}
