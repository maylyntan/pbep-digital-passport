"use client";

import { Compass, Flag, Medal, Trophy } from "lucide-react";

import { getMilestone, type MilestoneIcon } from "@/lib/milestones";

const ICONS: Record<MilestoneIcon, typeof Flag> = {
  flag: Flag,
  compass: Compass,
  medal: Medal,
  trophy: Trophy,
};

export function MilestoneCard({ stampCount }: { stampCount: number }) {
  const milestone = getMilestone(stampCount);
  const Icon = ICONS[milestone.icon];

  return (
    <div className="milestone-card">
      <Icon size={30} aria-hidden="true" />
      <div>
        <span>Current title</span>
        <strong>{milestone.label}</strong>
      </div>
    </div>
  );
}
