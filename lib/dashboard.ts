import { BOOTHS, TOTAL_BOOTHS } from "./booths";
import type { StampRow, StudentRow } from "./types";

export interface BoothStat {
  id: string;
  number: number;
  name: string;
  skill: string;
  participants: number;
  /** Share of registered students who have this booth confirmed. */
  participationRate: number;
}

export interface ClassStat {
  className: string;
  registered: number;
  participants: number;
  visits: number;
}

export interface StudentStat {
  id: string;
  studentName: string;
  studentId: string | null;
  className: string;
  boothsVisited: number;
  completed: boolean;
  lastActivityAt: string | null;
  boothSlugs: string[];
  record: Pick<
    StudentRow,
    "reflection" | "new_vocabulary" | "favourite_booth" | "speaking_goal"
  >;
}

export interface DashboardSummary {
  registeredStudents: number;
  participatingStudents: number;
  totalBoothVisits: number;
  completedPassports: number;
  averageBoothsPerParticipant: number;
  uniqueBoothsVisited: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  booths: BoothStat[];
  classes: ClassStat[];
  students: StudentStat[];
  generatedAt: string;
}

export function buildDashboard(students: StudentRow[], stamps: StampRow[]): DashboardData {
  const stampsByStudent = new Map<string, StampRow[]>();
  for (const stamp of stamps) {
    const list = stampsByStudent.get(stamp.student_id);
    if (list) list.push(stamp);
    else stampsByStudent.set(stamp.student_id, [stamp]);
  }

  const studentStats: StudentStat[] = students.map((student) => {
    const own = stampsByStudent.get(student.id) ?? [];
    const lastStamp = own.reduce<string | null>(
      (latest, stamp) =>
        !latest || stamp.confirmed_at > latest ? stamp.confirmed_at : latest,
      null,
    );

    return {
      id: student.id,
      studentName: student.student_name,
      studentId: student.student_id,
      className: student.class_name,
      boothsVisited: own.length,
      completed: own.length >= TOTAL_BOOTHS,
      lastActivityAt: lastStamp ?? student.updated_at ?? student.created_at,
      boothSlugs: own.map((stamp) => stamp.booth_slug),
      record: {
        reflection: student.reflection,
        new_vocabulary: student.new_vocabulary,
        favourite_booth: student.favourite_booth,
        speaking_goal: student.speaking_goal,
      },
    };
  });

  const registeredStudents = students.length;
  const participating = studentStats.filter((s) => s.boothsVisited > 0);
  const totalBoothVisits = stamps.length;

  const boothCounts = new Map<string, number>();
  for (const stamp of stamps) {
    boothCounts.set(stamp.booth_slug, (boothCounts.get(stamp.booth_slug) ?? 0) + 1);
  }

  const booths: BoothStat[] = BOOTHS.map((booth) => {
    const participants = boothCounts.get(booth.id) ?? 0;
    return {
      id: booth.id,
      number: booth.number,
      name: booth.name,
      skill: booth.skill,
      participants,
      participationRate: registeredStudents
        ? Math.round((participants / registeredStudents) * 100)
        : 0,
    };
  });

  const classMap = new Map<string, ClassStat>();
  for (const stat of studentStats) {
    const row = classMap.get(stat.className) ?? {
      className: stat.className,
      registered: 0,
      participants: 0,
      visits: 0,
    };
    row.registered += 1;
    if (stat.boothsVisited > 0) row.participants += 1;
    row.visits += stat.boothsVisited;
    classMap.set(stat.className, row);
  }

  return {
    summary: {
      registeredStudents,
      participatingStudents: participating.length,
      totalBoothVisits,
      completedPassports: studentStats.filter((s) => s.completed).length,
      averageBoothsPerParticipant: participating.length
        ? Math.round((totalBoothVisits / participating.length) * 10) / 10
        : 0,
      uniqueBoothsVisited: booths.filter((b) => b.participants > 0).length,
    },
    booths,
    classes: [...classMap.values()].sort((a, b) =>
      a.className.localeCompare(b.className),
    ),
    students: studentStats.sort((a, b) => a.studentName.localeCompare(b.studentName)),
    generatedAt: new Date().toISOString(),
  };
}

function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(students: StudentStat[]): string {
  const header = [
    "Student name",
    "Student ID",
    "Class",
    "Booths visited",
    "Completed",
    "Last activity",
  ];
  const rows = students.map((student) => [
    student.studentName,
    student.studentId ?? "Not provided",
    student.className,
    student.boothsVisited,
    student.completed ? "Yes" : "No",
    student.lastActivityAt ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "No activity yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "No activity yet";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export const EMPTY_DASHBOARD: DashboardData = {
  summary: {
    registeredStudents: 0,
    participatingStudents: 0,
    totalBoothVisits: 0,
    completedPassports: 0,
    averageBoothsPerParticipant: 0,
    uniqueBoothsVisited: 0,
  },
  booths: BOOTHS.map((booth) => ({
    id: booth.id,
    number: booth.number,
    name: booth.name,
    skill: booth.skill,
    participants: 0,
    participationRate: 0,
  })),
  classes: [],
  students: [],
  generatedAt: "",
};
