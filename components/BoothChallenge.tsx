"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Send } from "lucide-react";
import type { Booth, Passport } from "@/lib/types";
import { createStudentPassport, restorePassport } from "@/lib/passport";
import { supabase } from "@/lib/supabase";

export default function BoothChallenge({ booth }: { booth: Booth }) {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(true);
  const [state, setState] = useState<"idle" | "pending" | "confirmed" | "error">("idle");
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const checkExisting = useCallback(async (current: Passport) => {
    if (!supabase) return;
    const client = supabase;

    const { data: stamp } = await client
      .from("stamps")
      .select("id")
      .eq("student_id", current.id)
      .eq("booth_slug", booth.slug)
      .maybeSingle();

    if (stamp) {
      setState("confirmed");
      return;
    }

    const { data: pending } = await client
      .from("checkin_requests")
      .select("id, status")
      .eq("student_id", current.id)
      .eq("booth_slug", booth.slug)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      setRequestId(pending.id);
      setState("pending");
    }
  }, [booth.slug]);

  useEffect(() => {
    let active = true;

    async function openPassport() {
      const current = await restorePassport();
      if (!active) return;
      setPassport(current);
      if (current) await checkExisting(current);
      if (active) setLoadingPassport(false);
    }

    openPassport();
    return () => { active = false; };
  }, [checkExisting]);

  useEffect(() => {
    if (!supabase || !requestId) return;
    const client = supabase;
    const channel = client
      .channel(`checkin-${requestId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "checkin_requests", filter: `id=eq.${requestId}` },
        (payload) => {
          const next = payload.new as { status?: string };
          if (next.status === "confirmed") setState("confirmed");
          if (next.status === "rejected") {
            setState("idle");
            setMessage("The teacher declined this request. Complete the booth task and try again.");
          }
        }
      )
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, [requestId]);

  async function createPassportHere(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const result = await createStudentPassport({
      firstName: String(form.get("firstName") || ""),
      studentId: String(form.get("studentId") || ""),
      className: String(form.get("className") || ""),
    });

    setCreating(false);

    if (!result.passport) {
      setMessage(result.error || "Could not create passport.");
      return;
    }

    setPassport(result.passport);
    await checkExisting(result.passport);
  }

  async function requestConfirmation() {
    if (!passport) return;
    if (!supabase) {
      setState("error");
      setMessage("Supabase is not configured yet. Follow README.md to connect the backend.");
      return;
    }

    setMessage("");
    const { data, error } = await supabase
      .from("checkin_requests")
      .insert({ student_id: passport.id, booth_slug: booth.slug })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        await checkExisting(passport);
        return;
      }
      setState("error");
      setMessage(error.message);
      return;
    }

    setRequestId(data.id);
    setState("pending");
  }

  return (
    <main className="page-shell challenge-wrap">
      <Link href="/" className="eyebrow"><ArrowLeft size={14} /> Back to passport</Link>
      <section className="challenge-card card" style={{ marginTop: 18 }}>
        <div className="challenge-title">
          <span className="big-emoji">{booth.emoji}</span>
          <div><span className="card-kicker">Speaking challenge</span><h1>{booth.title}</h1></div>
        </div>
        <p className="challenge-prompt">{booth.prompt}</p>
        <div className="helper-box"><strong>Conversation tip:</strong><br />{booth.helper}</div>

        {loadingPassport ? (
          <div className="status-box pending">Opening your passport…</div>
        ) : !passport ? (
          <div className="status-box pending">
            <strong>Create your passport to continue</strong>
            <p style={{ marginTop: 8 }}>No student login is required. Enter your festival details once on this device.</p>
            <form className="form-grid" onSubmit={createPassportHere} style={{ marginTop: 16 }}>
              <div className="field"><label htmlFor="booth-firstName">First name / nickname</label><input id="booth-firstName" name="firstName" placeholder="e.g. Lisa" autoComplete="given-name" /></div>
              <div className="field"><label htmlFor="booth-studentId">Student ID</label><input id="booth-studentId" name="studentId" placeholder="e.g. 467544" autoComplete="off" /></div>
              <div className="field"><label htmlFor="booth-className">Class</label><input id="booth-className" name="className" placeholder="e.g. c3" autoComplete="off" /></div>
              <button className="primary-btn full" type="submit" disabled={creating}>{creating ? "Creating passport…" : "Create passport & continue"}</button>
            </form>
          </div>
        ) : state === "confirmed" ? (
          <div className="status-box success"><CheckCircle2 size={22} /> <strong>Stamp confirmed!</strong><br />Your teacher approved this booth. It is now saved in your passport.</div>
        ) : state === "pending" ? (
          <div className="status-box pending"><Clock3 size={22} /> <strong>Waiting for teacher confirmation</strong><br />Show the teacher your completed conversation. This page will update automatically when they approve it.</div>
        ) : (
          <>
            <div className="status-box success"><strong>Passport ready:</strong> {passport.firstName} · {passport.className} · ID {passport.studentId}</div>
            <p>When you finish speaking, ask the booth teacher to confirm your participation.</p>
            <button className="primary-btn full" onClick={requestConfirmation}><Send size={17} /> Request teacher confirmation</button>
          </>
        )}
        {message && <div className="status-box error">{message}</div>}
      </section>
    </main>
  );
}
