"use client";

import { useState, type FormEvent } from "react";

import type { Booth } from "@/lib/booths";
import { isValidStudentId, normaliseStudentId } from "@/lib/passport";
import type { RegistrationInput } from "@/lib/passport";

interface RegistrationFormProps {
  booth: Booth | null;
  busy: boolean;
  onSubmit: (input: RegistrationInput) => void;
}

interface FieldErrors {
  studentName?: string;
  studentId?: string;
  className?: string;
}

export function RegistrationForm({ booth, busy, onSubmit }: RegistrationFormProps) {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [className, setClassName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!studentName.trim()) next.studentName = "Enter your first name or nickname.";
    if (!studentId.trim()) {
      next.studentId = "Enter your Student ID number.";
    } else if (!isValidStudentId(studentId)) {
      next.studentId = "Student IDs look like CT1234 — the letters CT, then numbers.";
    }
    if (!className.trim()) next.className = "Enter your class.";
    return next;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
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
        Your passport stays linked to this device — if you switch device, sign in again
        with the same Student ID and first name.
      </p>

      {booth ? (
        <div className="notice" style={{ marginBottom: "22px" }}>
          <span>
            Create your passport to collect your stamp for <strong>{booth.name}</strong>.
          </span>
        </div>
      ) : null}

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="student-name">First name or nickname</label>
          <input
            id="student-name"
            type="text"
            value={studentName}
            maxLength={80}
            autoComplete="given-name"
            required
            aria-invalid={Boolean(errors.studentName)}
            aria-describedby={errors.studentName ? "student-name-error" : undefined}
            onChange={(event) => setStudentName(event.target.value)}
          />
          {errors.studentName ? (
            <p className="field-error" id="student-name-error">
              {errors.studentName}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="student-id">
            Student ID number <span className="hint">(e.g. CT1234)</span>
          </label>
          <input
            id="student-id"
            type="text"
            value={studentId}
            maxLength={40}
            inputMode="text"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="CT1234"
            required
            aria-invalid={Boolean(errors.studentId)}
            aria-describedby={errors.studentId ? "student-id-error" : "student-id-hint"}
            onChange={(event) => setStudentId(normaliseStudentId(event.target.value))}
          />
          {errors.studentId ? (
            <p className="field-error" id="student-id-error">
              {errors.studentId}
            </p>
          ) : (
            <p className="field-hint" id="student-id-hint">
              This is how your teacher records your participation.
            </p>
          )}
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
            aria-invalid={Boolean(errors.className)}
            aria-describedby={errors.className ? "class-name-error" : undefined}
            onChange={(event) => setClassName(event.target.value)}
          />
          {errors.className ? (
            <p className="field-error" id="class-name-error">
              {errors.className}
            </p>
          ) : null}
        </div>

        <button type="submit" className="cta cta--full" disabled={busy}>
          {busy ? "Opening…" : "Open My Passport"}
        </button>

        <p className="form-note">
          We only store your name, Student ID, class and booth stamps for the festival.
        </p>
      </form>
    </section>
  );
}
