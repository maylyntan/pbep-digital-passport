"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, LogOut, RefreshCcw, ShieldCheck, X } from "lucide-react";
import { booths } from "@/lib/booths";
import { supabase } from "@/lib/supabase";

type RequestRow = {
  id: string;
  booth_slug: string;
  requested_at: string;
  students: { first_name: string; student_code: string; class_name: string } | null;
};

export default function TeacherPortal() {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState("");

  const loadQueue = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("checkin_requests")
      .select("id, booth_slug, requested_at, students(first_name, student_code, class_name)")
      .eq("status", "pending")
      .order("requested_at", { ascending: true });
    if (error) setMessage(error.message);
    else setRequests((data || []) as unknown as RequestRow[]);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setLoading(false);
      if (data.session) loadQueue();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (session) loadQueue();
    });
    return () => listener.subscription.unsubscribe();
  }, [loadQueue]);

  useEffect(() => {
    if (!supabase || !signedIn) return;
    const channel = supabase.channel("teacher-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "checkin_requests" }, () => loadQueue())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [signedIn, loadQueue]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setMessage("Supabase is not configured. Add the environment variables first."); return; }
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (error) setMessage(error.message); else setMessage("");
  }

  async function decide(id: string, decision: "confirmed" | "rejected") {
    if (!supabase) return;
    setMessage("");
    const { error } = await supabase.rpc("teacher_decide_checkin", { request_id: id, decision });
    if (error) setMessage(error.message);
    await loadQueue();
  }

  const grouped = useMemo(() => booths.map((booth) => ({ booth, rows: requests.filter((request) => request.booth_slug === booth.slug) })).filter((group) => group.rows.length), [requests]);

  if (loading) return <main className="page-shell teacher-shell"><div className="card teacher-card">Loading teacher portal…</div></main>;

  if (!signedIn) {
    return (
      <main className="page-shell teacher-shell">
        <section className="card teacher-card teacher-login">
          <ShieldCheck size={34} />
          <span className="card-kicker">Staff only</span>
          <h1 style={{ fontSize: 46 }}>Teacher confirmation</h1>
          <p>Sign in with a teacher account created in Supabase Auth. Only approved teacher users can see or confirm student requests.</p>
          <form className="form-grid" onSubmit={signIn}>
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
            {message && <div className="status-box error">{message}</div>}
            <button className="secondary-btn full" type="submit">Sign in as teacher</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell teacher-shell">
      <div className="section-head">
        <div><span className="card-kicker">Live staff queue</span><h1>Confirm stamps</h1><p>Approve only after you have seen the student complete the speaking challenge.</p></div>
        <div className="actions"><button className="secondary-btn" onClick={loadQueue}><RefreshCcw size={17} /> Refresh</button><button className="danger-btn" onClick={() => supabase?.auth.signOut()}><LogOut size={17} /> Sign out</button></div>
      </div>
      {message && <div className="status-box error">{message}</div>}
      {requests.length === 0 ? <div className="empty-state">No students are waiting for confirmation right now.</div> : (
        grouped.map(({ booth, rows }) => (
          <section className="card teacher-card" key={booth.slug} style={{ marginBottom: 16 }}>
            <div className="booth-top"><div><span className="booth-number">{rows.length} waiting</span><h2>{booth.emoji} {booth.title}</h2></div></div>
            <div className="queue">
              {rows.map((request) => (
                <div className="queue-item" key={request.id}>
                  <div className="queue-main"><strong>{request.students?.first_name || "Student"}</strong><span>{request.students?.class_name || "Unknown class"} · ID {request.students?.student_code || "—"}</span><span>Requested {new Date(request.requested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                  <div className="queue-actions"><button className="danger-btn" onClick={() => decide(request.id, "rejected")}><X size={16} /> Decline</button><button className="primary-btn" onClick={() => decide(request.id, "confirmed")}><Check size={16} /> Confirm</button></div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
