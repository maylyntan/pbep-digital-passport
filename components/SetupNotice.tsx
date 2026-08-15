import { CircleAlert } from "lucide-react";

/** Shown when Supabase environment variables are missing. */
export function SetupNotice() {
  return (
    <div className="panel stack">
      <span className="kicker">Setup required</span>
      <h2 style={{ color: "var(--kaplan-navy)", letterSpacing: "-0.03em" }}>
        Connect Supabase to continue
      </h2>
      <div className="notice">
        <CircleAlert size={18} aria-hidden="true" />
        <span>
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, run{" "}
          <code>supabase/schema.sql</code> in the SQL editor, and enable anonymous
          sign-ins under Authentication → Providers.
        </span>
      </div>
      <p className="form-note">
        See the README for the full setup checklist. Everything else in the app is
        ready — this notice disappears once the environment is configured.
      </p>
    </div>
  );
}
