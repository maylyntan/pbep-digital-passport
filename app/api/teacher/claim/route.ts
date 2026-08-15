import { NextResponse } from "next/server";

import { getServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/** Generic failure — never reveals whether the code or the session was wrong. */
function reject(status = 400) {
  return NextResponse.json(
    { ok: false, error: "That invite code was not accepted." },
    { status },
  );
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const expectedCode = process.env.TEACHER_INVITE_CODE;
  const supabase = getServiceClient();

  if (!expectedCode || !supabase) {
    return NextResponse.json(
      { ok: false, error: "Facilitator access is not configured on this deployment." },
      { status: 500 },
    );
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return reject(401);

  let inviteCode = "";
  try {
    const body = (await request.json()) as { inviteCode?: unknown };
    inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
  } catch {
    return reject();
  }

  if (!inviteCode || inviteCode !== expectedCode) return reject();

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  const user = userResult?.user;

  if (userError || !user || user.is_anonymous) return reject(401);
  if (!user.email) return reject(401);

  const { error } = await supabase.from("teacher_profiles").upsert(
    {
      user_id: user.id,
      display_name: (user.user_metadata?.name as string | undefined) ?? user.email,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Facilitator access could not be granted." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
