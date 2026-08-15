"use client";

import { TOTAL_BOOTHS } from "@/lib/booths";
import { progressCopy } from "@/lib/milestones";

export function ProgressPanel({ stampCount }: { stampCount: number }) {
  const percent = Math.min(100, Math.round((stampCount / TOTAL_BOOTHS) * 100));

  return (
    <section className="progress-panel" aria-label="Festival progress">
      <div className="progress-copy">
        <div>
          <span className="kicker">Festival progress</span>
          <h2>
            <span>{stampCount}</span> of {TOTAL_BOOTHS} booths
          </h2>
        </div>
        <p className="progress-note">{progressCopy(stampCount)}</p>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={stampCount}
        aria-valuemin={0}
        aria-valuemax={TOTAL_BOOTHS}
        aria-label={`${stampCount} of ${TOTAL_BOOTHS} booth stamps collected`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
