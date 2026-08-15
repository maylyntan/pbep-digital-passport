"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { SetupNotice } from "@/components/SetupNotice";
import { useToast } from "@/components/Toaster";
import { useTeacherSession } from "@/lib/teacher";

export default function TeacherLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { supabase, status, refresh } = useTeacherSession();

  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Facilitator sign in | Find Your Voice";
  }, []);

  if (status === "unconfigured") {
    return (
      <main className="auth-page">
        <div className="shell">
          <SetupNotice />
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: accessCode,
      });
      if (error) throw error;

      toast.success("Signed in.");
      refresh();
      router.replace("/teacher");
    } catch {
      toast.error("We couldn't sign you in. Check the email and access code.");
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
        <h1>Festival facilitator</h1>
        <p>
          Sign in to confirm student stamps and view participation. Accounts are set up
          by the campaign lead — use your school email and the festival access code.
        </p>

        <form className="form-grid" onSubmit={handleSubmit} style={{ maxWidth: "none" }}>
          <div className="field">
            <label htmlFor="teacher-email">School email</label>
            <input
              id="teacher-email"
              type="email"
              autoComplete="email"
              value={email}
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="access-code">
              Festival access code{" "}
              <span className="hint">(shared by the campaign lead)</span>
            </label>
            <input
              id="access-code"
              type="password"
              autoComplete="current-password"
              value={accessCode}
              required
              onChange={(event) => setAccessCode(event.target.value)}
            />
          </div>

          <button type="submit" className="cta cta--full" disabled={busy}>
            <ShieldCheck size={18} aria-hidden="true" />
            {busy ? "Please wait…" : "Sign in"}
          </button>

          <p className="form-note">
            No account yet? Ask the campaign lead to add your email — facilitator
            accounts cannot be self-created.
          </p>
        </form>

        <Link href="/" className="auth-footer-link">
          Back to the student passport
        </Link>
      </div>
    </main>
  );
}
