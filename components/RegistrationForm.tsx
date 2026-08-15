"use client";

import { useState, type FormEvent } from "react";

import type { Booth } from "@/lib/booths";
import type { RegistrationInput } from "@/lib/passport";

interface RegistrationFormProps {
  booth: Booth | null;
  busy: boolean;
  onSubmit: (input: RegistrationInput) => void;
}

export function RegistrationForm({ booth, busy, onSubmit }: RegistrationFormProps) {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [className, setClassName] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!studentName.trim() || !className.trim()) return;
    onSubmit({ studentName, studentId, className });
  }

  return (
    <section className="panel">
      <span className="kicker">Create your passport</span>
      <h2
        style={{
          color: "var(--kaplan-navy)",
          fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)",
          letterSpacing: "-0.035em",
          margin: "8px 0 12px",
        }}
      >
        Ready to find your voice?
      </h2>
      <p className="lead" style={{ marginBottom: "24px", maxWidth: "620px" }}>
        Enter the school details your teacher will use to identify your participation.
        Your passport will stay linked to this device.
      </p>

      {booth ? (
        <div className="notice" style={{ marginBottom: "22px" }}>
          <span>
            Create your passport to collect your stamp for <strong>{booth.name}</strong>.
          </span>
        </div>
      ) : null}

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="student-name">First name or nickname</label>
          <input
            id="student-name"
            type="text"
            value={studentName}
            maxLength={80}
            autoComplete="given-name"
            required
            onChange={(event) => setStudentName(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="student-id">
            Student ID number <span className="hint">(optional)</span>
          </label>
          <input
            id="student-id"
            type="text"
            value={studentId}
            maxLength={40}
            inputMode="numeric"
            onChange={(event) => setStudentId(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="class-name">Class</label>
          <input
            id="class-name"
            type="text"
            value={className}
            maxLength={40}
            required
            placeholder="e.g. 2A"
            onChange={(event) => setClassName(event.target.value)}
          />
        </div>

        <button type="submit" className="cta cta--full" disabled={busy}>
          {busy ? "Opening…" : "Open My Passport"}
        </button>

        <p className="form-note">
          We only store your name, class and booth stamps for the festival.
        </p>
      </form>
    </section>
  );
}
