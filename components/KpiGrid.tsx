"use client";

import {
  BarChart3,
  CircleCheck,
  Mic,
  Trophy,
  Users,
  Waypoints,
} from "lucide-react";

import { TOTAL_BOOTHS } from "@/lib/booths";
import type { DashboardSummary } from "@/lib/dashboard";

export function KpiGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="kpi-grid" aria-label="Festival summary">
      <article className="kpi">
        <Users size={22} aria-hidden="true" />
        <span>Registered students</span>
        <strong>{summary.registeredStudents}</strong>
      </article>
      <article className="kpi kpi--coral">
        <CircleCheck size={22} aria-hidden="true" />
        <span>Students participating</span>
        <strong>{summary.participatingStudents}</strong>
      </article>
      <article className="kpi">
        <Mic size={22} aria-hidden="true" />
        <span>Total booth visits</span>
        <strong>{summary.totalBoothVisits}</strong>
      </article>
      <article className="kpi kpi--coral">
        <Trophy size={22} aria-hidden="true" />
        <span>Completed all {TOTAL_BOOTHS}</span>
        <strong>{summary.completedPassports}</strong>
      </article>
      <article className="kpi kpi--wide">
        <BarChart3 size={22} aria-hidden="true" />
        <span>Average booths per participant</span>
        <strong>{summary.averageBoothsPerParticipant}</strong>
      </article>
      <article className="kpi kpi--wide">
        <Waypoints size={22} aria-hidden="true" />
        <span>Unique booths visited</span>
        <strong>
          {summary.uniqueBoothsVisited} / {TOTAL_BOOTHS}
        </strong>
      </article>
    </section>
  );
}
