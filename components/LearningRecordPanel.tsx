"use client";

import { BookOpen, Heart, Save, Sparkles, Target } from "lucide-react";

import type { LearningRecord } from "@/lib/types";

interface LearningRecordPanelProps {
  record: LearningRecord;
  saving: boolean;
  onChange: (field: keyof LearningRecord, value: string) => void;
  onSave: () => void;
  onNewPassport: () => void;
}

export function LearningRecordPanel({
  record,
  saving,
  onChange,
  onSave,
  onNewPassport,
}: LearningRecordPanelProps) {
  return (
    <section className="panel">
      <div className="record-heading">
        <div>
          <span className="kicker">Personal learning record</span>
          <h2
            style={{
              color: "var(--kaplan-navy)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              letterSpacing: "-0.035em",
              marginTop: "6px",
            }}
          >
            Capture what you discovered
          </h2>
        </div>
        <BookOpen size={30} aria-hidden="true" />
      </div>

      <div className="record-grid">
        <div>
          <label className="record-label" htmlFor="reflection">
            <Sparkles size={17} aria-hidden="true" /> Reflection
          </label>
          <textarea
            id="reflection"
            value={record.reflection}
            maxLength={1000}
            placeholder="Today I felt more confident when…"
            onChange={(event) => onChange("reflection", event.target.value)}
          />
        </div>

        <div>
          <label className="record-label" htmlFor="new-vocabulary">
            <BookOpen size={17} aria-hidden="true" /> New vocabulary
          </label>
          <textarea
            id="new-vocabulary"
            value={record.new_vocabulary}
            maxLength={1000}
            placeholder="Write new words or expressions you heard…"
            onChange={(event) => onChange("new_vocabulary", event.target.value)}
          />
        </div>

        <div>
          <label className="record-label" htmlFor="favourite-booth">
            <Heart size={17} aria-hidden="true" /> Favourite booth
          </label>
          <input
            id="favourite-booth"
            type="text"
            value={record.favourite_booth}
            maxLength={120}
            placeholder="Which booth did you enjoy most?"
            onChange={(event) => onChange("favourite_booth", event.target.value)}
          />
        </div>

        <div>
          <label className="record-label" htmlFor="speaking-goal">
            <Target size={17} aria-hidden="true" /> Speaking goal
          </label>
          <input
            id="speaking-goal"
            type="text"
            value={record.speaking_goal}
            maxLength={300}
            placeholder="Next time, I will…"
            onChange={(event) => onChange("speaking_goal", event.target.value)}
          />
        </div>
      </div>

      <div className="record-actions">
        <button type="button" className="ghost-button" onClick={onNewPassport}>
          New passport
        </button>
        <button type="button" className="cta" onClick={onSave} disabled={saving}>
          <Save size={17} aria-hidden="true" />
          {saving ? "Saving…" : "Save learning record"}
        </button>
      </div>
    </section>
  );
}
