"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { SetupNotice } from "@/components/SetupNotice";
import { useToast } from "@/components/Toaster";
import { claimTeacherAccess, useTeacherSession } from "@/lib/teacher";

type Mode = "signin" | "signup";

export default function TeacherLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { supabase, status, refresh } = useTeacherSession();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
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
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;

        // A fresh sign-up may not carry a session if email confirmation is on.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          toast.info("Check your email to confirm the account, then sign in.");
          setMode("signin");
          return;
        }

        await claimTeacherAccess(supabase, inviteCode);
        toast.success("Facilitator access is ready.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }

      refresh();
      router.replace("/teacher");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("invite")
          ? message
          : "We couldn't sign you in. Check your details and try again.",
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
        <h1>{mode === "signup" ? "Create facilitator account" : "Festival facilitator"}</h1>
        <p>
          {mode === "signup"
            ? "Create and verify a facilitator account for the private dashboard."
            : "Sign in to confirm student stamps and view participation."}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Account mode">
          <button
            type="button"
            role="tab"
            className="auth-tab"
            aria-selected={mode === "signin"}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className="auth-tab"
            aria-selected={mode === "signup"}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit} style={{ maxWidth: "none" }}>
          {mode === "signup" ? (
            <div className="field">
              <label htmlFor="teacher-name">Name</label>
              <input
                id="teacher-name"
                type="text"
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="teacher-email">Email</label>
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
            <label htmlFor="teacher-password">Password</label>
            <input
              id="teacher-password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              value={password}
              required
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {mode === "signup" ? (
            <div className="field">
              <label htmlFor="invite-code">
                Festival invite code <span className="hint">(from the campaign lead)</span>
              </label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                required
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </div>
          ) : null}

          <button type="submit" className="cta cta--full" disabled={busy}>
            <ShieldCheck size={18} aria-hidden="true" />
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <Link href="/" className="auth-footer-link">
          Back to the student passport
        </Link>
      </div>
    </main>
  );
}
