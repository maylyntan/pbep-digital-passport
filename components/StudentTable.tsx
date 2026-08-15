"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Search } from "lucide-react";

import { BOOTHS, TOTAL_BOOTHS } from "@/lib/booths";
import { formatRelative, toCsv, type StudentStat } from "@/lib/dashboard";

export function StudentTable({ students }: { students: StudentStat[] }) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const classNames = useMemo(
    () => [...new Set(students.map((student) => student.className))].sort(),
    [students],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesClass = classFilter === "all" || student.className === classFilter;
      const haystack =
        `${student.studentName} ${student.studentId ?? ""} ${student.className}`.toLowerCase();
      return matchesClass && (!needle || haystack.includes(needle));
    });
  }, [students, query, classFilter]);

  function handleExport() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "english-festival-participation.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">Student records</span>
          <h2>Registered student participation</h2>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={handleExport}
          disabled={filtered.length === 0}
        >
          <Download size={16} aria-hidden="true" /> Export CSV
        </button>
      </div>

      <div className="admin-filters">
        <label className="admin-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="text"
            aria-label="Search students"
            placeholder="Search name, Student ID or class"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter by class"
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
        >
          <option value="all">All classes</option>
          {classNames.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No students match this search yet.</p>
      ) : (
        <div className="student-list">
          {filtered.map((student) => {
            const open = expanded === student.id;
            const visited = new Set(student.boothSlugs);
            const status = student.completed
              ? "Complete"
              : student.boothsVisited > 0
                ? "Participating"
                : "Registered";

            return (
              <article className="student-row" key={student.id}>
                <button
                  type="button"
                  className="student-row-main"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : student.id)}
                >
                  <span className="student-avatar" aria-hidden="true">
                    {student.studentName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="student-identity">
                    <strong>{student.studentName}</strong>
                    <small>
                      ID {student.studentId ?? "Not provided"} · Class{" "}
                      {student.className}
                    </small>
                  </span>
                  <span className="student-progress">
                    <b>
                      {student.boothsVisited}/{TOTAL_BOOTHS}
                    </b>
                    <small>booths visited</small>
                  </span>
                  <span
                    className={`student-status${
                      student.completed
                        ? " student-status--complete"
                        : student.boothsVisited > 0
                          ? " student-status--active"
                          : ""
                    }`}
                  >
                    {status}
                  </span>
                  <span className="student-last">
                    <small>Last activity</small>
                    <b>{formatRelative(student.lastActivityAt)}</b>
                  </span>
                  {open ? (
                    <ChevronUp size={18} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={18} aria-hidden="true" />
                  )}
                </button>

                {open ? (
                  <div className="student-detail">
                    <div>
                      <span className="kicker">Booths confirmed</span>
                      <div className="student-booths">
                        {BOOTHS.map((booth) => (
                          <span
                            key={booth.id}
                            className={`student-booth-chip${
                              visited.has(booth.id) ? " student-booth-chip--done" : ""
                            }`}
                          >
                            {String(booth.number).padStart(2, "0")} {booth.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="record-readout">
                      <div>
                        <strong>Reflection</strong>
                        <p>{student.record.reflection ?? "Not written yet."}</p>
                      </div>
                      <div>
                        <strong>New vocabulary</strong>
                        <p>{student.record.new_vocabulary ?? "Not written yet."}</p>
                      </div>
                      <div>
                        <strong>Favourite booth</strong>
                        <p>{student.record.favourite_booth ?? "Not written yet."}</p>
                      </div>
                      <div>
                        <strong>Speaking goal</strong>
                        <p>{student.record.speaking_goal ?? "Not written yet."}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
