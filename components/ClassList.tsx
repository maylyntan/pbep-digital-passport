"use client";

import type { ClassStat } from "@/lib/dashboard";

export function ClassList({ classes }: { classes: ClassStat[] }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">Class overview</span>
          <h2>Participation by class</h2>
        </div>
      </div>

      {classes.length === 0 ? (
        <p className="empty-state">Class activity will appear after students register.</p>
      ) : (
        <div className="class-list">
          {classes.map((row) => (
            <div className="class-row" key={row.className}>
              <strong>{row.className}</strong>
              <span>
                {row.participants}/{row.registered} participating
              </span>
              <b>{row.visits} visits</b>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
