"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { SetupNotice } from "@/components/SetupNotice";
import { useTeacherSession } from "@/lib/teacher";
import type { TeacherSession } from "@/lib/teacher";

interface TeacherGateProps {
  children: (session: TeacherSession) => ReactNode;
}

/** Wraps the facilitator area: loading, signed out, not authorised, or content. */
export function TeacherGate({ children }: TeacherGateProps) {
  const teacher = useTeacherSession();

  if (teacher.status === "unconfigured") {
    return (
      <main className="auth-page">
        <div className="shell">
          <SetupNotice />
        </div>
      </main>
    );
  }

  if (teacher.status === "loading") {
    return (
      <main className="loading-screen">
        <div className="spinner" aria-hidden="true" />
        <p>Checking your access…</p>
      </main>
    );
  }

  if (teacher.status === "signed-out") {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <h1>Facilitators only</h1>
          <p>Sign in with your facilitator account to reach this page.</p>
          <Link href="/teacher/login" className="cta cta--full">
            Go to sign in
          </Link>
          <Link href="/" className="auth-footer-link">
            Back to the student passport
          </Link>
        </div>
      </main>
    );
  }

  if (teacher.status === "not-teacher") {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <h1>Not a facilitator account</h1>
          <p>
            This email is signed in but has not been given facilitator access. Ask the
            campaign lead to add it, then sign in again.
          </p>
          <button
            type="button"
            className="cta cta--full"
            onClick={() => teacher.supabase?.auth.signOut()}
          >
            Sign out
          </button>
          <Link href="/" className="auth-footer-link">
            Back to the student passport
          </Link>
        </div>
      </main>
    );
  }

  return <>{children(teacher)}</>;
}
