"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BarChart3, CircleUserRound, DoorOpen, QrCode } from "lucide-react";

import { BoothBars } from "@/components/BoothBars";
import { BrandHeader } from "@/components/BrandHeader";
import { ClassList } from "@/components/ClassList";
import { KpiGrid } from "@/components/KpiGrid";
import { PendingQueue } from "@/components/PendingQueue";
import { SiteFooter } from "@/components/SiteFooter";
import { StudentTable } from "@/components/StudentTable";
import { TeacherGate } from "@/components/TeacherGate";
import { useToast } from "@/components/Toaster";
import {
  EMPTY_DASHBOARD,
  buildDashboard,
  formatRelative,
  type DashboardData,
} from "@/lib/dashboard";
import type { PendingCheckin, StampRow, StudentRow } from "@/lib/types";

export default function TeacherDashboardPage() {
  return <TeacherGate>{(teacher) => <Dashboard supabase={teacher.supabase!} />}</TeacherGate>;
}

function Dashboard({ supabase }: { supabase: SupabaseClient }) {
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [pending, setPending] = useState<PendingCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsResult, stampsResult, pendingResult] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("stamps").select("*"),
        supabase
          .from("checkin_requests")
          .select("*, students(student_name, student_id, class_name)")
          .eq("status", "pending")
          .order("requested_at", { ascending: true }),
      ]);

      if (studentsResult.error) throw new Error(studentsResult.error.message);
      if (stampsResult.error) throw new Error(stampsResult.error.message);
      if (pendingResult.error) throw new Error(pendingResult.error.message);

      setData(
        buildDashboard(
          (studentsResult.data as StudentRow[]) ?? [],
          (stampsResult.data as StampRow[]) ?? [],
        ),
      );
      setPending((pendingResult.data as PendingCheckin[]) ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    document.title = "Festival Admin | Find Your Voice";
    void load();
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      const user = sessionData.session?.user;
      setSignedInAs((user?.user_metadata?.name as string | undefined) ?? user?.email ?? "");
    });
  }, [load, supabase]);

  // Live updates: any check-in or stamp change re-reads the dashboard.
  useEffect(() => {
    const channel = supabase
      .channel("festival-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkin_requests" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stamps" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "students" },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  async function handleDecide(requestId: string, decision: "confirmed" | "rejected") {
    setDeciding(requestId);
    const snapshot = pending;
    setPending((current) => current.filter((request) => request.id !== requestId));

    const { error: rpcError } = await supabase.rpc("teacher_decide_checkin", {
      request_id: requestId,
      decision,
    });

    if (rpcError) {
      setPending(snapshot);
      toast.error("That decision didn't save. Please try again.");
    } else {
      toast.success(decision === "confirmed" ? "Stamp confirmed." : "Check-in rejected.");
      void load();
    }
    setDeciding(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/teacher/login");
  }

  const generated = useMemo(() => formatRelative(data.generatedAt || null), [data.generatedAt]);

  return (
    <div className="page">
      <div className="hero">
        <div className="shell">
          <BrandHeader
            title="Festival Admin"
            subtitle="Find Your Voice · English Festival Day"
            href="/teacher"
            onNavy
            actions={
              <>
                <Link href="/teacher/booth-kit" className="header-link">
                  <QrCode size={16} aria-hidden="true" /> Booth QR kit
                </Link>
                <Link href="/" className="header-link">
                  Student passport
                </Link>
                <button type="button" className="header-link" onClick={handleSignOut}>
                  <DoorOpen size={16} aria-hidden="true" /> Sign out
                </button>
              </>
            }
          />
          <div className="admin-intro" style={{ padding: "34px 0 10px" }}>
            <div>
              <span className="hero-eyebrow">
                <BarChart3 size={14} aria-hidden="true" /> Live participation dashboard
              </span>
              <h1>Every booth. Every voice.</h1>
              <p className="hero-copy">
                Monitor registrations, participation across all 25 booths, class activity
                and each student&rsquo;s festival journey.
              </p>
            </div>
            <div className="admin-session-card">
              <CircleUserRound size={22} aria-hidden="true" />
              <div>
                <span>Signed in as</span>
                <strong>{signedInAs || "Facilitator"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="page-body shell main-lift">
        <div className="stack">
          {error ? (
            <div className="notice notice--error">
              <span>{error}</span>
            </div>
          ) : null}

          <PendingQueue
            requests={pending}
            deciding={deciding}
            onDecide={handleDecide}
          />

          <KpiGrid summary={data.summary} />

          <div className="admin-grid">
            <BoothBars booths={data.booths} loading={loading} onRefresh={() => void load()} />
            <div className="side-stack">
              <ClassList classes={data.classes} />
              <article className="panel note-panel">
                <span className="kicker">How counting works</span>
                <h2
                  style={{
                    color: "var(--kaplan-navy)",
                    fontSize: "1.3rem",
                    letterSpacing: "-0.03em",
                    marginTop: "6px",
                  }}
                >
                  One stamp per student, per booth
                </h2>
                <p>
                  Scanning the same booth again will not increase participation, so booth
                  totals remain accurate.
                </p>
              </article>
            </div>
          </div>

          <StudentTable students={data.students} />

          <p className="updated-line">
            Dashboard updated {data.generatedAt ? generated.toLowerCase() : "just now"}.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
