"use client";

import { Check, Clock, Mic } from "lucide-react";

import type { Booth } from "@/lib/booths";
import type { BoothState } from "@/lib/types";

interface StampTileProps {
  booth: Booth;
  state: BoothState;
  justEarned?: boolean;
}

const STATE_LABEL: Record<BoothState, string> = {
  empty: "not completed",
  pending: "waiting for facilitator",
  confirmed: "completed",
  rejected: "not completed",
};

export function StampTile({ booth, state, justEarned = false }: StampTileProps) {
  const modifier =
    state === "confirmed"
      ? " stamp-tile--confirmed"
      : state === "pending"
        ? " stamp-tile--pending"
        : "";

  return (
    <div
      className={`stamp-tile${modifier}${justEarned ? " stamp-tile--just-earned" : ""}`}
      aria-label={`${booth.name}: ${STATE_LABEL[state]}`}
    >
      <div className="stamp-number">{String(booth.number).padStart(2, "0")}</div>
      <div className="stamp-body">
        <strong>{booth.name}</strong>
        <span>{state === "pending" ? "Waiting for facilitator" : booth.skill}</span>
      </div>
      <div className="stamp-status" aria-hidden="true">
        {state === "confirmed" ? (
          <Check size={15} strokeWidth={3} />
        ) : state === "pending" ? (
          <Clock size={15} />
        ) : (
          <Mic size={15} />
        )}
      </div>
    </div>
  );
}
