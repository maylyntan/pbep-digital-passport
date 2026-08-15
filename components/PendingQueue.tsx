"use client";

import { Check, X } from "lucide-react";

import { getBooth } from "@/lib/booths";
import { formatRelative } from "@/lib/dashboard";
import type { PendingCheckin } from "@/lib/types";

interface PendingQueueProps {
  requests: PendingCheckin[];
  deciding: string | null;
  onDecide: (requestId: string, decision: "confirmed" | "rejected") => void;
}

export function PendingQueue({ requests, deciding, onDecide }: PendingQueueProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">Waiting for you</span>
          <h2>Confirm booth check-ins</h2>
        </div>
        {requests.length > 0 ? (
          <span className="queue-count" aria-label={`${requests.length} waiting`}>
            {requests.length}
          </span>
        ) : null}
      </div>

      {requests.length === 0 ? (
        <p className="empty-state">No students waiting. Everything is confirmed.</p>
      ) : (
        <div className="queue-list">
          {requests.map((request) => {
            const booth = getBooth(request.booth_slug);
            const student = request.students;
            return (
              <article className="queue-row" key={request.id}>
                <div className="queue-booth" aria-hidden="true">
                  {booth ? String(booth.number).padStart(2, "0") : "??"}
                </div>
                <div className="queue-body">
                  <strong>{student?.student_name ?? "Student"}</strong>
                  <span>
                    Class {student?.class_name ?? "—"} ·{" "}
                    {booth?.name ?? request.booth_slug} ·{" "}
                    {formatRelative(request.requested_at)}
                  </span>
                </div>
                <div className="queue-actions">
                  <button
                    type="button"
                    className="cta"
                    disabled={deciding === request.id}
                    onClick={() => onDecide(request.id, "confirmed")}
                  >
                    <Check size={16} aria-hidden="true" /> Confirm
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={deciding === request.id}
                    onClick={() => onDecide(request.id, "rejected")}
                  >
                    <X size={16} aria-hidden="true" /> Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
