import { TOTAL_BOOTHS } from "./booths";

export type MilestoneIcon = "flag" | "compass" | "medal" | "trophy";

export interface Milestone {
  label: string;
  icon: MilestoneIcon;
  /** Stamp count that unlocks the next title (equals TOTAL_BOOTHS at the top). */
  next: number;
}

export function getMilestone(stampCount: number): Milestone {
  if (stampCount >= 25) return { label: "Voice Champion", icon: "trophy", next: 25 };
  if (stampCount >= 15) return { label: "Confident Communicator", icon: "medal", next: 25 };
  if (stampCount >= 8) return { label: "Voice Adventurer", icon: "compass", next: 15 };
  return { label: "Voice Explorer", icon: "flag", next: 8 };
}

export function progressCopy(stampCount: number): string {
  if (stampCount >= TOTAL_BOOTHS) return "Passport complete — you found your voice!";
  const remaining = getMilestone(stampCount).next - stampCount;
  return `${remaining} more stamp${remaining === 1 ? "" : "s"} to your next milestone.`;
}
