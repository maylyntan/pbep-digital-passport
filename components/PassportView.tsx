"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CircleCheck, Mic, QrCode } from "lucide-react";

import { BrandHeader } from "@/components/BrandHeader";
import { CheckinCard } from "@/components/CheckinCard";
import { LearningRecordPanel } from "@/components/LearningRecordPanel";
import { MilestoneCard } from "@/components/MilestoneCard";
import { ProgressPanel } from "@/components/ProgressPanel";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SetupNotice } from "@/components/SetupNotice";
import { SiteFooter } from "@/components/SiteFooter";
import { StampTile } from "@/components/StampTile";
import { useToast } from "@/components/Toaster";
import { BOOTHS, HEADLINE_SKILLS, getBooth } from "@/lib/booths";
import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
  claimPassport,
  loadPassport,
  registerPassport,
  requestCheckin,
  saveLearningRecord,
  startNewPassport,
  type DatabaseError,
  type PassportSnapshot,
  type RegistrationInput,
} from "@/lib/passport";
import { ensureAnonymousSession, getSupabase } from "@/lib/supabase-client";
import type {
  BoothState,
  CheckinRow,
  LearningRecord,
  StampRow,
  StudentRow,
} from "@/lib/types";

const EMPTY_RECORD: LearningRecord = {
  reflection: "",
  new_vocabulary: "",
  favourite_booth: "",
  speaking_goal: "",
};

export function PassportView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const boothSlug = searchParams.get("booth");
  const booth = useMemo(() => getBooth(boothSlug), [boothSlug]);

  const [supabase] = useState<SupabaseClient | null>(() => getSupabase());
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PassportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<LearningRecord>(EMPTY_RECORD);
  const [justEarned, setJustEarned] = useState<string | null>(null);

  const boothSlugRef = useRef<string | null>(boothSlug);
  boothSlugRef.current = boothSlug;

  // ---- session + first load -------------------------------------------------
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      const userId = await ensureAnonymousSession(supabase);
      if (!active) return;
      setAuthUserId(userId);

      if (userId) {
        const loaded = await loadPassport(supabase, userId);
        if (!active) return;
        if (loaded) {
          setSnapshot(loaded);
          setRecord({
            reflection: loaded.student.reflection ?? "",
            new_vocabulary: loaded.student.new_vocabulary ?? "",
            favourite_booth: loaded.student.favourite_booth ?? "",
            speaking_goal: loaded.student.speaking_goal ?? "",
          });
        }
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  const studentId = snapshot?.student.id ?? null;

  // ---- realtime: stamps + check-in decisions --------------------------------
  useEffect(() => {
    if (!supabase || !studentId) return;

    const channel = supabase
      .channel(`passport:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stamps",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          const stamp = payload.new as StampRow;
          setSnapshot((current) => {
            if (!current) return current;
            if (current.stamps.some((existing) => existing.id === stamp.id)) return current;
            return { ...current, stamps: [...current.stamps, stamp] };
          });

          const earned = getBooth(stamp.booth_slug);
          setJustEarned(stamp.booth_slug);
          window.setTimeout(() => setJustEarned(null), 900);
          toast.success(`Stamp collected: ${earned?.name ?? "Booth"}`);

          if (boothSlugRef.current === stamp.booth_slug) {
            router.replace("/", { scroll: false });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checkin_requests",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          const row = payload.new as CheckinRow | null;
          if (!row) return;

          setSnapshot((current) => {
            if (!current) return current;
            const others = current.checkins.filter((existing) => existing.id !== row.id);
            return { ...current, checkins: [...others, row] };
          });

          if (row.status === "rejected" && boothSlugRef.current === row.booth_slug) {
            toast.info(
              "Your facilitator didn't confirm this one yet. Ask them and try again.",
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, studentId, router, toast]);

  // ---- derived state --------------------------------------------------------
  const confirmedSlugs = useMemo(
    () => new Set((snapshot?.stamps ?? []).map((stamp) => stamp.booth_slug)),
    [snapshot],
  );

  const latestCheckins = useMemo(() => {
    const map = new Map<string, CheckinRow>();
    for (const checkin of snapshot?.checkins ?? []) {
      const existing = map.get(checkin.booth_slug);
      if (!existing || checkin.requested_at >= existing.requested_at) {
        map.set(checkin.booth_slug, checkin);
      }
    }
    return map;
  }, [snapshot]);

  const boothState = useCallback(
    (slug: string): BoothState => {
      if (confirmedSlugs.has(slug)) return "confirmed";
      const checkin = latestCheckins.get(slug);
      if (checkin?.status === "pending") return "pending";
      if (checkin?.status === "rejected") return "rejected";
      return "empty";
    },
    [confirmedSlugs, latestCheckins],
  );

  const stampCount = confirmedSlugs.size;

  // ---- actions --------------------------------------------------------------
  /** Applies a loaded passport, including the saved learning record. */
  function applyPassport(loaded: PassportSnapshot) {
    setSnapshot(loaded);
    setRecord({
      reflection: loaded.student.reflection ?? "",
      new_vocabulary: loaded.student.new_vocabulary ?? "",
      favourite_booth: loaded.student.favourite_booth ?? "",
      speaking_goal: loaded.student.speaking_goal ?? "",
    });
  }

  async function handleRegister(input: RegistrationInput) {
    if (!supabase || !authUserId) return;
    setBusy(true);
    try {
      // A returning student keeps their stamps: the school ID finds the
      // passport, and the first name proves it is theirs.
      const returning = await claimPassport(supabase, input.studentId, input.studentName);
      if (returning) {
        const reloaded = await loadPassport(supabase, authUserId);
        if (reloaded) {
          applyPassport(reloaded);
          toast.success(`Welcome back, ${returning.student_name}!`);
          return;
        }
      }

      let student: StudentRow;
      try {
        student = await registerPassport(supabase, authUserId, input);
      } catch (error) {
        const code = (error as DatabaseError).code;

        // The device holds a session for a user that no longer exists. Take a
        // fresh anonymous session and try once more rather than dead-ending.
        if (code === FOREIGN_KEY_VIOLATION) {
          const freshUserId = await startNewPassport(supabase);
          if (!freshUserId) throw error;
          setAuthUserId(freshUserId);
          student = await registerPassport(supabase, freshUserId, input);
        } else if (code === UNIQUE_VIOLATION) {
          // This session already has a passport — load it instead of failing.
          const existing = await loadPassport(supabase, authUserId);
          if (!existing) throw error;
          applyPassport(existing);
          toast.info("This device already has a passport.");
          return;
        } else {
          throw error;
        }
      }

      setSnapshot({ student, stamps: [], checkins: [] });
      toast.success("Your Voice Passport is ready!");
    } catch (error) {
      const code = (error as DatabaseError).code;

      if (code === "NAME_MISMATCH") {
        toast.error(
          "That Student ID is registered under a different name. Check your details or ask your teacher.",
        );
      } else if (code === "DEVICE_HAS_PASSPORT") {
        toast.error(
          "This device already has a different passport. Tap New passport first.",
        );
      } else {
        console.error("Passport registration failed:", error);
        toast.error("We couldn't create your passport. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestStamp() {
    if (!supabase || !snapshot || !booth) return;
    setBusy(true);
    try {
      const checkin = await requestCheckin(supabase, snapshot.student.id, booth.id);
      setSnapshot((current) =>
        current ? { ...current, checkins: [...current.checkins, checkin] } : current,
      );
      toast.success("Sent to your facilitator — hold on a moment.");
    } catch (error) {
      if ((error as DatabaseError).code === UNIQUE_VIOLATION) {
        toast.info("You've already asked for this stamp.");
      } else {
        console.error("Check-in request failed:", error);
        toast.error("That request didn't send. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRecord() {
    if (!supabase || !snapshot) return;
    setSaving(true);
    try {
      const student = await saveLearningRecord(supabase, snapshot.student.id, record);
      setSnapshot((current) => (current ? { ...current, student } : current));
      toast.success("Learning record saved.");
    } catch (error) {
      console.error("Learning record save failed:", error);
      toast.error("Your reflection could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleNewPassport() {
    if (!supabase) return;
    const confirmed = window.confirm(
      "Start a new passport on this device? Your current record will remain stored, but this device will no longer be linked to it.",
    );
    if (!confirmed) return;

    const userId = await startNewPassport(supabase);
    setAuthUserId(userId);
    setSnapshot(null);
    setRecord(EMPTY_RECORD);
    toast.success("Ready for a new passport.");
  }

  // ---- render ---------------------------------------------------------------
  if (!supabase) {
    return (
      <div className="page">
        <div className="hero">
          <div className="shell">
            <BrandHeader onNavy />
          </div>
        </div>
        <main className="page-body shell main-lift">
          <SetupNotice />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="hero">
          <div className="shell">
            <BrandHeader onNavy />
          </div>
        </div>
        <main className="page-body loading-screen">
          <div className="spinner" aria-hidden="true" />
          <p>Opening your passport…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="page">
        <div className="hero">
          <div className="shell">
            <BrandHeader onNavy />
            <div className="hero-grid">
              <div>
                <span className="hero-eyebrow">Your festival journey starts here</span>
                <h1>My Voice Passport</h1>
                <p className="hero-copy">
                  Speak, connect and collect a digital stamp at every booth. Every
                  conversation brings you one step closer to becoming a Voice Champion.
                </p>
              </div>
              <aside className="hero-card" aria-label="How it works">
                <strong>Three steps at every booth</strong>
                <div className="hero-stat">
                  <span className="dot" aria-hidden="true" />
                  <span>Scan</span>
                </div>
                <div className="hero-stat">
                  <span className="dot" aria-hidden="true" />
                  <span>Speak</span>
                </div>
                <div className="hero-stat">
                  <span className="dot" aria-hidden="true" />
                  <span>Collect</span>
                </div>
              </aside>
            </div>
          </div>
        </div>
        <main className="page-body shell main-lift">
          <RegistrationForm booth={booth} busy={busy} onSubmit={handleRegister} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { student } = snapshot;
  const classLine = [
    student.class_name,
    student.student_id ? `ID ${student.student_id}` : null,
    "Keep speaking, keep connecting.",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="page">
      <div className="hero">
        <div className="shell">
          <BrandHeader onNavy />
          <div className="hero-grid">
            <div>
              <span className="hero-eyebrow">
                <Mic size={14} aria-hidden="true" /> Personal participation tracker
              </span>
              <h1>Hello, {student.student_name}!</h1>
              <p className="hero-class-line">{classLine}</p>
            </div>
            <MilestoneCard stampCount={stampCount} />
          </div>
        </div>
      </div>

      <main className="page-body shell main-lift">
        <div className="stack">
          {booth ? (
            <CheckinCard
              booth={booth}
              state={boothState(booth.id)}
              busy={busy}
              onRequest={handleRequestStamp}
            />
          ) : null}

          <ProgressPanel stampCount={stampCount} />

          <div className="content-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="kicker">Participation tracker</span>
                  <h2>Your {BOOTHS.length} booth stamps</h2>
                </div>
                <span className="stamp-legend">
                  <span className="dot" aria-hidden="true" /> Completed
                </span>
              </div>
              <div className="stamp-grid">
                {BOOTHS.map((item) => (
                  <StampTile
                    key={item.id}
                    booth={item}
                    state={boothState(item.id)}
                    justEarned={justEarned === item.id}
                  />
                ))}
              </div>
            </section>

            <aside className="side-stack">
              <div className="tip-card">
                <div className="tip-icon" aria-hidden="true">
                  <QrCode size={24} />
                </div>
                <span className="kicker" style={{ color: "var(--kaplan-gold)" }}>
                  At every booth
                </span>
                <h3>Scan after you speak</h3>
                <p>
                  Complete the activity, ask the facilitator for the QR code, then
                  collect your stamp.
                </p>
              </div>

              <div className="skills-card">
                <span className="kicker">You are building</span>
                <ul className="skills-list">
                  {HEADLINE_SKILLS.map((skill) => (
                    <li key={skill}>
                      <CircleCheck size={18} aria-hidden="true" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          <LearningRecordPanel
            record={record}
            saving={saving}
            onChange={(field, value) =>
              setRecord((current) => ({ ...current, [field]: value }))
            }
            onSave={handleSaveRecord}
            onNewPassport={handleNewPassport}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
