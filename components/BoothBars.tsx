"use client";

import { RefreshCw } from "lucide-react";

import { TOTAL_BOOTHS } from "@/lib/booths";
import type { BoothStat } from "@/lib/dashboard";

interface BoothBarsProps {
  booths: BoothStat[];
  loading: boolean;
  onRefresh: () => void;
}

export function BoothBars({ booths, loading, onRefresh }: BoothBarsProps) {
  const busiest = Math.max(1, ...booths.map((booth) => booth.participants));

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">All {TOTAL_BOOTHS} booths</span>
          <h2>Participants at each booth</h2>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={15} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="booth-list">
        {booths.map((booth) => (
          <div className="booth-row" key={booth.id}>
            <div className="booth-row-number">
              {String(booth.number).padStart(2, "0")}
            </div>
            <div className="booth-row-name">
              <strong>{booth.name}</strong>
              <span>{booth.skill}</span>
            </div>
            <div className="booth-bar" aria-hidden="true">
              <span style={{ width: `${(booth.participants / busiest) * 100}%` }} />
            </div>
            <div className="booth-total">
              <strong>{booth.participants}</strong>
              <span>{booth.participationRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
