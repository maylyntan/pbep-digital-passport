"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, QrCode, RotateCcw, Sparkles } from "lucide-react";
import { booths } from "@/lib/booths";
import { clearPassport, createStudentPassport, restorePassport } from "@/lib/passport";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Passport, Stamp } from "@/lib/types";

export default function PassportApp() {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const refreshStamps = useCallback(async (current: Passport) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("stamps")
      .select("booth_slug, confirmed_at")
      .eq("student_id", current.id)
      .order("confirmed_at", { ascending: true });
    if (data) setStamps(data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const current = await restorePassport();
      if (!active) return;
      setPassport(current);
      if (current) await refreshStamps(current);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [refreshStamps]);

  async function createPassport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await createStudentPassport({
      firstName: String(form.get("firstName") || ""),
      studentId: String(form.get("studentId") || ""),
      className: String(form.get("className") || ""),
    });

    if (!result.passport) {
      setMessage(result.error || "Could not create passport.");
      return;
    }

    setPassport(result.passport);
    setMessage("");
    await refreshStamps(result.passport);
  }

  function reset() {
    clearPassport();
    setPassport(null);
    setStamps([]);
    setMessage("");
  }

  const completed = useMemo(() => new Set(stamps.map((stamp) => stamp.booth_slug)), [stamps]);
  const progress = Math.round((completed.size / booths.length) * 100);

  if (loading) return <div className="page-shell"><div className="passport-card card">Opening passport…</div></div>;

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow"><Sparkles size={14} /> Your festival journey starts here</span>
        <h1>My Voice<br />Passport</h1>
        <p>Speak, connect and collect a teacher-confirmed digital stamp at every booth. Your passport stays linked to this device.</p>
      </section>

      <section className="steps" aria-label="How it works">
        <div className="step"><div className="step-icon"><QrCode size={20} /></div><strong>Scan</strong><span>Open a booth challenge</span></div>
        <div className="step"><div className="step-icon"><MessageCircle size={20} /></div><strong>Speak</strong><span>Complete the conversation</span></div>
        <div className="step"><div className="step-icon"><CheckCircle2 size={20} /></div><strong>Collect</strong><span>A teacher confirms your stamp</span></div>
      </section>

      {!passport ? (
        <section className="passport-card card">
          <span className="card-kicker">Create your passport</span>
          <h2>Ready to find your voice?</h2>
          <p>Enter your festival details once. This device will remember your passport.</p>
          {!isSupabaseConfigured && <div className="status-box pending">Demo mode: Supabase is not configured yet. Add your environment variables before the live event.</div>}
          <form className="form-grid" onSubmit={createPassport}>
            <div className="field"><label htmlFor="firstName">First name / nickname</label><input id="firstName" name="firstName" placeholder="e.g. Maya" autoComplete="given-name" /></div>
            <div className="field"><label htmlFor="studentId">Student ID</label><input id="studentId" name="studentId" placeholder="e.g. 240184" autoComplete="off" /></div>
            <div className="field"><label htmlFor="className">Class</label><input id="className" name="className" placeholder="e.g. B2 Morning" autoComplete="off" /></div>
            {message && <div className="status-box error">{message}</div>}
            <button className="primary-btn full" type="submit">Open My Passport <ArrowRight size={18} /></button>
            <div className="tiny-note">Only the minimum event information is stored. Avoid entering sensitive personal information.</div>
          </form>
        </section>
      ) : (
        <section className="passport-card card passport-summary">
          <div className="identity-strip">
            <div className="avatar">{passport.firstName.slice(0, 1).toUpperCase()}</div>
            <div className="identity">
              <span className="card-kicker">Voice Passport</span>
              <h2>{passport.firstName}</h2>
              <p>{passport.className} · ID {passport.studentId}</p>
            </div>
            <span className="badge">{completed.size}/{booths.length} stamps</span>
          </div>

          <div className="progress-row"><span>Festival progress</span><span>{progress}%</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

          <div className="stamp-grid">
            {booths.map((booth) => (
              <div key={booth.slug} className={`stamp ${completed.has(booth.slug) ? "done" : ""}`}>
                <span><span className="emoji">{completed.has(booth.slug) ? "✓" : booth.emoji}</span>{booth.title}</span>
              </div>
            ))}
          </div>

          {completed.size === booths.length && <div className="status-box success"><strong>Voice Champion!</strong><br />You completed every booth. Great work.</div>}
          <div className="actions">
            <span className="tiny-note">Scan the QR displayed at each physical booth to continue.</span>
            <button className="danger-btn" onClick={reset}><RotateCcw size={16} /> Reset this device</button>
          </div>
        </section>
      )}
    </main>
  );
}
