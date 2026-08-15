"use client";

import { CircleCheck, Clock, QrCode } from "lucide-react";

import type { Booth } from "@/lib/booths";
import type { BoothState } from "@/lib/types";

interface CheckinCardProps {
  booth: Booth;
  state: BoothState;
  busy: boolean;
  onRequest: () => void;
}

export function CheckinCard({ booth, state, busy, onRequest }: CheckinCardProps) {
  const confirmed = state === "confirmed";
  const pending = state === "pending";

  const modifier = confirmed
    ? " checkin-card--done"
    : pending
      ? " checkin-card--pending"
      : "";

  const body = confirmed
    ? "You have already collected this stamp. Well done!"
    : pending
      ? "Your facilitator is confirming this booth."
      : booth.prompt;

  const buttonLabel = confirmed
    ? "Stamp collected"
    : pending
      ? "Waiting for confirmation"
      : state === "rejected"
        ? "Request again"
        : "Request my stamp";

  return (
    <section className={`checkin-card${modifier}`}>
      <div className="checkin-icon" aria-hidden="true">
        {confirmed ? (
          <CircleCheck size={28} />
        ) : pending ? (
          <Clock size={28} />
        ) : (
          <QrCode size={28} />
        )}
      </div>
      <div className="checkin-body">
        <span className="kicker">
          Booth {String(booth.number).padStart(2, "0")} scanned
        </span>
        <h2>{booth.name}</h2>
        <p>{body}</p>
      </div>
      <button
        type="button"
        className="cta"
        onClick={onRequest}
        disabled={busy || confirmed || pending}
      >
        {busy ? "Sending…" : buttonLabel}
      </button>
    </section>
  );
}
