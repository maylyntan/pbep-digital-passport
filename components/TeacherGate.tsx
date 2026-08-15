"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { SetupNotice } from "@/components/SetupNotice";
import { useToast } from "@/components/Toaster";
import { claimTeacherAccess, useTeacherSession } from "@/lib/teacher";
import type { TeacherSession } from "@/lib/teacher";

interface TeacherGateProps {
  children: (session: TeacherSession) => ReactNode;
}

/** Wraps the facilitator area: loading, signed out, invite claim, or content. */
export function TeacherGate({ children }: TeacherGateProps) {
  const teacher = useTeacherSession();
  const toast = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

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
    async function handleClaim() {
      if (!teacher.supabase) return;
      setBusy(true);
      try {
        await claimTeacherAccess(teacher.supabase, inviteCode);
        toast.success("Facilitator access is ready.");
        teacher.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "That invite code was not accepted.",
        );
      } finally {
        setBusy(false);
      }
    }

    return (
      <main className="auth-page">
        <div className="auth-card">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <h1>Enter your invite code</h1>
          <p>
            This account does not have facilitator access yet. Enter the festival invite
            code to unlock the dashboard and the booth QR kit.
          </p>
          <div className="form-grid" style={{ maxWidth: "none" }}>
            <div className="field">
              <label htmlFor="gate-invite">Festival invite code</label>
              <input
                id="gate-invite"
                type="text"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="cta cta--full"
              onClick={handleClaim}
              disabled={busy || !inviteCode.trim()}
            >
              <ShieldCheck size={18} aria-hidden="true" />
              {busy ? "Checking…" : "Unlock facilitator access"}
            </button>
          </div>
          <button
            type="button"
            className="auth-footer-link"
            style={{ background: "none", border: 0, cursor: "pointer", width: "100%" }}
            onClick={() => teacher.supabase?.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return <>{children(teacher)}</>;
}
