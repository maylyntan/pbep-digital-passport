export interface StudentRow {
  id: string;
  auth_user_id: string;
  student_name: string;
  student_id: string | null;
  class_name: string;
  reflection: string | null;
  new_vocabulary: string | null;
  favourite_booth: string | null;
  speaking_goal: string | null;
  created_at: string;
  updated_at: string;
}

export type CheckinStatus = "pending" | "confirmed" | "rejected";

export interface CheckinRow {
  id: string;
  student_id: string;
  booth_slug: string;
  status: CheckinStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

/** Pending queue row, joined with the student it belongs to. */
export interface PendingCheckin extends CheckinRow {
  students: Pick<StudentRow, "student_name" | "student_id" | "class_name"> | null;
}

export interface StampRow {
  id: string;
  student_id: string;
  booth_slug: string;
  confirmed_at: string;
  confirmed_by: string;
}

export interface LearningRecord {
  reflection: string;
  new_vocabulary: string;
  favourite_booth: string;
  speaking_goal: string;
}

/** Per-booth tile state on the student passport. */
export type BoothState = "empty" | "pending" | "confirmed" | "rejected";
