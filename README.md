# My Voice Passport

Digital participation passport for the **Kaplan Singapore — Find Your Voice English Festival Day**.

Students carry a passport on their phone, complete a speaking activity at each of the 25 booths,
scan the booth's printed QR code, and collect a stamp once a facilitator confirms it. Facilitators
get a live dashboard of participation across every booth, class and student.

> Every Voice Matters. Every Conversation Counts.

Built to the specification in [PRD.md](PRD.md).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript, React 19) |
| Styling | Plain CSS with Kaplan brand tokens in `app/globals.css` |
| Data | Supabase Postgres with Row Level Security |
| Realtime | Supabase Realtime on `checkin_requests` and `stamps` |
| Student auth | Supabase anonymous sign-in (device-linked) |
| Facilitator auth | Supabase email + password, gated by an invite code |
| QR codes | `qrcode.react` (SVG, generated in the browser) |
| Hosting | Netlify with `@netlify/plugin-nextjs` |

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Student passport — registration, then the stamp dashboard |
| `/?booth=<slug>` | Public | Passport with the scanned booth's check-in card pinned to the top |
| `/teacher/login` | Public | Facilitator sign in / sign up |
| `/teacher` | Facilitator | Pending check-in queue, KPIs, booth and class breakdowns, student records, CSV export |
| `/teacher/booth-kit` | Facilitator | Printable A4 QR kit, one card per booth |

The booth kit is **not** linked from any student-facing page. Printed cards at the physical
booths are the only place students meet a QR code.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the whole of [`supabase/schema.sql`](supabase/schema.sql).
3. Go to **Authentication → Providers** and enable **Anonymous Sign-Ins**. Students cannot
   register without this.
4. Go to **Authentication → Providers → Email** and decide whether facilitator accounts need
   email confirmation. With confirmation on, a new facilitator must confirm by email, sign in,
   and then enter the invite code.

The schema also adds `checkin_requests` and `stamps` to the realtime publication. If Supabase
reports a table is already in the publication, ignore that message.

### 3. Environment

Copy `.env.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SITE_URL=https://<site>.netlify.app
SUPABASE_SERVICE_ROLE_KEY=<service role key>
TEACHER_INVITE_CODE=<a code you share with facilitators>
```

`SUPABASE_SERVICE_ROLE_KEY` and `TEACHER_INVITE_CODE` are server-only — never prefix them with
`NEXT_PUBLIC_`.

> **`NEXT_PUBLIC_SITE_URL` is baked into every booth QR code.** Set the final production URL
> before printing the kit.

### 4. Run

```bash
npm run dev
```

---

## First facilitator

1. Go to `/teacher/login` → **Sign up**.
2. Enter name, email, password and the festival invite code.
3. The app calls `POST /api/teacher/claim`, which verifies the code server-side and creates the
   `teacher_profiles` row that grants access.

An account without that row sees an invite-code prompt instead of the dashboard. Sign-up alone
grants nothing.

---

## How a stamp is issued

```
Student completes the activity
  → scans the printed booth card  ( /?booth=<slug> )
  → taps "Request my stamp"       ( pending checkin_requests row )
Facilitator sees it in the live queue on /teacher
  → taps "Confirm"                ( teacher_decide_checkin RPC )
  → stamp row is written by the security-definer function
Student's phone updates within ~2 seconds via realtime
```

Students can never write to `stamps` — there is no insert policy on that table at all. The unique
constraint on `(student_id, booth_slug)` means the same booth can never be counted twice, and the
partial unique index means a student can only have one pending request per booth.

Titles unlock at 8, 15 and 25 confirmed stamps: Voice Explorer → Voice Adventurer →
Confident Communicator → Voice Champion.

---

## Deploy to Netlify

1. Push the repo to GitHub.
2. In Netlify, **Add new site → Import an existing project**, and pick the repo.
3. Build command `npm run build`, publish directory `.next` (already set in `netlify.toml`).
4. Add all five environment variables under **Site settings → Environment variables**.
5. Deploy, then open `/teacher/booth-kit` and print the cards **after** the final URL is live.

---

## Festival-day runbook

**Before the day**

- Confirm the production URL, then print the QR kit (4 cards per A4 sheet, 7 sheets).
- Scan a printed card with a phone to check it opens the passport.
- Share the invite code with facilitators and have each of them sign in once, in advance.
- Ask facilitators to keep `/teacher` open on the booth device — the queue is live.

**On the day**

- Students open the passport, register with first name / nickname, optional student ID, and class.
- At each booth: speak first, then scan, then tap **Request my stamp**.
- The facilitator confirms from the queue. The stamp appears on the student's phone immediately.

**If something goes wrong**

| Problem | Fix |
|---|---|
| Student cleared their browser or swapped device | The old passport stays in the dashboard, but the device link is gone. They register again; earlier stamps stay on the original record. |
| Student tapped request twice | Harmless — only one pending row can exist per booth. |
| Wrong student confirmed | Reject was not the action taken, so the stamp exists. Remove the row from the `stamps` table in Supabase. |
| Queue not updating | Check the realtime publication in Supabase and refresh the dashboard. |
| Facilitator sees "Enter your invite code" | Their account has no `teacher_profiles` row. Enter the code to unlock. |

---

## Scripts

```bash
npm run dev     # local development
npm run build   # production build
npm run start   # serve the production build
npm run check   # TypeScript, no emit
```

---

## Data and privacy

Only first name or nickname, an optional student ID, class, booth stamps and the student's own
learning record are stored. No email, no photos, no student-to-student data. Decide how long
records are kept after the festival and who deletes them.

---

## Repository notes

`Archive - do not use/` is an earlier prototype kept for reference only. It is git-ignored and
nothing in the current build imports from it.
