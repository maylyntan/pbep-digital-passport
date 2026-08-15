# Product Requirements Document
## Kaplan "Find Your Voice" — My Voice Passport (Digital Participation Passport)

**Version:** 1.0
**Date:** 15 August 2026
**Owner:** KHEA Acad
**Status:** Ready for build
**Repo:** `pbep-dp` (new GitHub repo, all existing content replaced)
**Target host:** Netlify (matches `kaplanfindyourvoice.netlify.app`)

---

## 1. Summary

Build a mobile-first web app that replaces the prototype. Students at Kaplan Singapore's **Find Your Voice — English Festival Day** carry a **digital passport**, visit up to **25 speaking booths**, scan the booth's printed QR code after completing the activity, and collect a **stamp** once a facilitator confirms it. Teachers get a live dashboard of participation across every booth, class and student.

This is a **rebrand-and-rebuild**, not a fork:

- **Drop all Skywork branding and infrastructure.** No "Edit with Skywork" badge, no `skywork.ai` scripts, no `__SKYBASE_APP_CONFIG__` API layer, no `data-lov-*` / `data-component-*` attributes, no Google Tag Manager, no `better-auth`.
- **Adopt the Kaplan visual identity** defined at `https://kaplanfindyourvoice.netlify.app/` (navy/coral/gold), replacing the prototype's bright blue-and-orange palette.
- **Rebuild the backend** on Next.js + Supabase with a facilitator-confirmed stamp flow.

### 1.1 Success criteria

| # | Criterion |
|---|---|
| S1 | A student can register a passport and collect a confirmed stamp on a phone in under 30 seconds at a booth. |
| S2 | A stamp can only be issued by a signed-in facilitator; no student can self-issue. |
| S3 | The teacher dashboard reflects a new stamp within 2 seconds, without a page refresh. |
| S4 | The booth QR kit prints to A4 with one legible, scannable card per booth. |
| S5 | Every page passes WCAG 2.1 AA colour contrast and is fully usable at 360 px width. |
| S6 | No Skywork/Lovable string, asset, script or attribute appears anywhere in the repo or built output. |

### 1.2 Non-goals

- Student accounts with passwords, email, or personal data beyond first name / student ID / class.
- Native mobile apps.
- In-app camera QR scanning (students use the phone's native camera app; the QR is a plain URL).
- Multi-event / multi-school tenancy. One festival, one booth set.
- Public leaderboards or inter-student competition.

---

## 2. Users and roles

| Role | Auth | Can do |
|---|---|---|
| **Student** | Supabase anonymous session, persisted on the device | Create a passport, view own progress, request a check-in by scanning a booth QR, write a learning record, start a fresh passport |
| **Facilitator / Teacher** | Supabase email + password, plus a `teacher_profiles` marker row | Everything a student can see for themselves, plus: approve/reject pending check-ins, view the live dashboard, open and print the booth QR kit, export CSV |
| **First administrator** | Same as teacher, claims the dashboard once | Claim teacher access on first run using the invite code |

There is **no separate admin role** beyond teacher. Any account holding a `teacher_profiles` row has full facilitator rights. Access is gated by the **invite code**, not by open sign-up.

---

## 3. Brand and design system

### 3.1 Tokens (authoritative — taken from `kaplanfindyourvoice.netlify.app`)

```css
:root {
  /* Kaplan brand */
  --kaplan-navy:  #0d2b45;
  --kaplan-deep:  #001f3f;
  --kaplan-blue:  #156082;
  --kaplan-coral: #e5533d;
  --kaplan-gold:  #d1b679;

  /* Neutrals */
  --ink:     #1d2e44;
  --muted:   #5f6f7d;
  --line:    #dfe6ec;
  --surface: #ffffff;
  --wash:    #f4f7fa;

  --shadow: 0 16px 40px rgba(13,43,69,.12);
  --radius: 22px;
}
```

Body background (carry over exactly):

```css
background:
  radial-gradient(circle at top right, rgba(229,83,61,.12), transparent 28rem),
  linear-gradient(180deg, #fff 0%, var(--wash) 100%);
```

### 3.2 Palette migration — replace the prototype's tokens

| Prototype (delete) | Kaplan replacement | Used for |
|---|---|---|
| `--primary: #0061d7` | `--kaplan-navy #0d2b45` (surfaces, headings) / `--kaplan-blue #156082` (links, secondary UI) | Headings, nav, progress fill |
| `--secondary: #ff7e0f` | `--kaplan-coral #e5533d` | Primary CTA, kickers, accent bars, brand mark |
| `--accent: #ffbc48` | `--kaplan-gold #d1b679` | Milestone/achievement chrome, focus rings |
| `--background: #f0f8ff` | `--wash #f4f7fa` + coral radial wash | Page background |
| `--foreground: #052248` | `--ink #1d2e44`, headings `--kaplan-navy` | Body copy |
| `--muted: #d8ecff` / `--muted-foreground: #40638a` | `--line #dfe6ec` / `--muted #5f6f7d` | Borders, secondary text |
| `--radius: .9rem` | `--radius: 22px` (cards 28px, pills 999px, tiles 16–18px) | Corners |

### 3.3 Typography

- Family: `Arial, Helvetica, sans-serif` — matches the Kaplan campaign site exactly. **Do not** ship the prototype's "Avenir Next" stack and do not load a webfont.
- `h1`: `clamp(2.65rem, 8vw, 5.5rem)`, `line-height: .93`, `letter-spacing: -.055em`, colour `--kaplan-navy` (white on the hero).
- `h2`: `clamp(1.85rem, 4vw, 3rem)`, `line-height: 1.05`, `letter-spacing: -.035em`, colour `--kaplan-navy`.
- `.kicker` / eyebrow: uppercase, `letter-spacing: .1em`, `font-size: .78rem`, `font-weight: 900`, colour `--kaplan-coral`.
- Body: `line-height: 1.55`, colour `--ink`; secondary copy `--muted`.

### 3.4 Component patterns (mirror the campaign site)

- **Hero:** `linear-gradient(135deg, var(--kaplan-deep), var(--kaplan-navy) 65%, #174f71)`, white text, decorative ring `::after` (360 px circle, `72px solid rgba(255,255,255,.06)`, offset top-right).
- **Brand lockup:** 35 px coral rounded square (`border-radius: 10px`) containing a white **K**, followed by `KAPLAN SINGAPORE` in uppercase 800-weight, then the sub-line `Find Your Voice · English Festival Day`.
- **Panel:** white, `border-radius: 28px`, `1px solid rgba(13,43,69,.08)`, `var(--shadow)`; main content pulled up `margin-top: -34px` over the hero.
- **Card:** `border-radius: 18px`, `1px solid var(--line)`, `linear-gradient(180deg,#fff,#fbfcfd)`; icon chip 42 px, `rgba(229,83,61,.1)` on coral.
- **Phase strip:** `--wash` background, `border-left: 4px solid var(--kaplan-coral)`.
- **CTA:** coral pill, `min-height: 50px`, `font-weight: 900`, `box-shadow: 0 10px 24px rgba(229,83,61,.25)`, hover `translateY(-2px)`.
- **Focus ring:** `outline: 3px solid var(--kaplan-gold); outline-offset: 3px` on every interactive element.
- **Reduced motion:** honour `prefers-reduced-motion: reduce` (animations and transitions to `.01ms`).
- Icons: `lucide-react` only (the prototype's icon set), stroked, never filled.

### 3.5 Voice and tone

Warm, encouraging, British spelling (*favourite*, *practise*, *organise*). Sentence case for headings, uppercase only for kickers. Campaign line, used in the footer of every page:

> **Every Voice Matters.** Every Conversation Counts.

---

## 4. Technical architecture

### 4.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript, React 19) |
| Styling | Plain CSS with custom properties in `app/globals.css` + colocated module CSS. No Tailwind, no shadcn/ui — the prototype's Tailwind/shadcn layer is dropped. |
| Data | Supabase Postgres with Row Level Security |
| Realtime | Supabase Realtime on `checkin_requests` and `stamps` |
| Student auth | Supabase **anonymous sign-in** (must be enabled in Supabase → Authentication → Providers) |
| Teacher auth | Supabase email + password, gated by an invite code |
| QR generation | `qrcode.react` (SVG, client-side, no network calls) |
| Icons | `lucide-react` |
| Hosting | Netlify with `@netlify/plugin-nextjs` |

### 4.2 Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Student passport. Registration form when no passport exists; dashboard when it does. |
| `/?booth=<slug>` | Public | Passport with a **check-in card** for that booth pinned to the top. This is the QR target. |
| `/teacher/login` | Public | Teacher sign in / sign up (sign-up requires the invite code). |
| `/teacher` | Teacher | Live dashboard: KPIs, pending check-in queue, per-booth participation, per-class rollup, student records, CSV export. |
| `/teacher/booth-kit` | **Teacher only** | Printable A4 QR kit, one card per booth. Not linked from any student-facing page. |
| `*` | Public | 404 — Kaplan-branded, with a "Return to my passport" link. |

> **Change from the prototype:** the QR kit was publicly reachable at `/booth-kit` and linked from the student header. It now lives behind teacher auth at `/teacher/booth-kit`, and the student header link is removed. Printed cards at the physical booths are the only way students meet a QR code.

### 4.3 Data model

`supabase/schema.sql`, run once in the Supabase SQL editor. Extends the shape the prototype exposed, with the facilitator-confirm flow.

```sql
create extension if not exists pgcrypto;

-- One row per student passport.
create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   uuid not null unique references auth.users(id) on delete cascade,
  student_name   text not null check (char_length(student_name) between 1 and 80),
  student_id     text check (char_length(student_id) <= 40),
  class_name     text not null check (char_length(class_name) between 1 and 40),
  -- Personal learning record
  reflection      text check (char_length(reflection) <= 1000),
  new_vocabulary  text check (char_length(new_vocabulary) <= 1000),
  favourite_booth text check (char_length(favourite_booth) <= 120),
  speaking_goal   text check (char_length(speaking_goal) <= 300),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Marks an auth user as a facilitator.
create table if not exists public.teacher_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Student taps "I've completed this activity" → pending row.
create table if not exists public.checkin_requests (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  booth_slug   text not null,
  status       text not null default 'pending'
               check (status in ('pending','confirmed','rejected')),
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references auth.users(id)
);

create unique index if not exists one_pending_checkin_per_booth_idx
  on public.checkin_requests(student_id, booth_slug) where status = 'pending';
create index if not exists checkin_requests_status_idx
  on public.checkin_requests(status, requested_at);

-- Confirmed stamps. Written only by the security-definer RPC.
create table if not exists public.stamps (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  booth_slug   text not null,
  confirmed_at timestamptz not null default now(),
  confirmed_by uuid not null references auth.users(id),
  unique(student_id, booth_slug)
);

create index if not exists stamps_student_idx on public.stamps(student_id, confirmed_at);
```

**RLS (all four tables `enable row level security`):**

- `public.is_teacher()` — `security definer`, returns whether `auth.uid()` has a `teacher_profiles` row. Granted to `authenticated` only.
- `students`: insert where `auth_user_id = auth.uid()`; update own row only (learning record); select own row or any row if `is_teacher()`.
- `teacher_profiles`: select own row only. No client insert — creation goes through the claim route using the service role key.
- `checkin_requests`: insert only with `status = 'pending'`, `decided_by is null`, and a `students` row owned by `auth.uid()`; select own rows or all rows if `is_teacher()`. **No client update** — decisions go through the RPC.
- `stamps`: select own or all if `is_teacher()`. **No client insert/update/delete at all.**

> **Naming trap:** `students` has its own text column called `student_id` (the school ID),
> which shadows `checkin_requests.student_id` / `stamps.student_id` (uuid) inside a policy
> subquery. Always qualify the outer column — `s.id = stamps.student_id`, never
> `s.id = student_id` — or Postgres rejects the policy with
> `operator does not exist: uuid = text`.

**Decision RPC** (`security definer`, mirrors the archived implementation):

```sql
create or replace function public.teacher_decide_checkin(request_id uuid, decision text)
returns void language plpgsql security definer set search_path = public as $$
declare req public.checkin_requests%rowtype;
begin
  if not public.is_teacher() then raise exception 'Not authorised as a facilitator'; end if;
  if decision not in ('confirmed','rejected') then raise exception 'Invalid decision'; end if;

  select * into req from public.checkin_requests where id = request_id for update;
  if req.id is null then raise exception 'Request not found'; end if;
  if req.status <> 'pending' then raise exception 'Request already decided'; end if;

  update public.checkin_requests
     set status = decision, decided_at = now(), decided_by = auth.uid()
   where id = request_id;

  if decision = 'confirmed' then
    insert into public.stamps(student_id, booth_slug, confirmed_by)
    values (req.student_id, req.booth_slug, auth.uid())
    on conflict (student_id, booth_slug) do nothing;
  end if;
end; $$;
```

Add `checkin_requests` **and** `stamps` to the `supabase_realtime` publication.

### 4.4 Server routes

Only one, because everything else is RLS-safe from the client:

| Route | Method | Body | Behaviour |
|---|---|---|---|
| `/api/teacher/claim` | POST | `{ inviteCode }` | Validates `inviteCode` against `TEACHER_INVITE_CODE` (server-side env, never exposed). On match, inserts a `teacher_profiles` row for the caller's user id using `SUPABASE_SERVICE_ROLE_KEY`. Rate-limit to 5 attempts per IP per 10 minutes; respond with a generic failure message on mismatch. |

### 4.5 Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://<site>.netlify.app   # used to build absolute QR URLs
SUPABASE_SERVICE_ROLE_KEY=                        # server only, never NEXT_PUBLIC_
TEACHER_INVITE_CODE=                              # server only
```

Ship a `.env.example` with these keys and empty values. `.gitignore` must cover `.env*`, `.next/`, `node_modules/`, and `Archive - do not use/`.

---

## 5. Feature specifications

### 5.1 Booth dataset

`lib/booths.ts` — a frozen array of 25 objects, exactly as below. `id` is the QR slug and the database `booth_slug`; **never renumber or re-slug after the QR kit is printed.**

| # | id | Name | Category | Skill | Prompt |
|---|---|---|---|---|---|
| 1 | `conversation-cafe` | Conversation Café | Conversation | Asking questions | Keep a friendly conversation going for two minutes. |
| 2 | `story-builder` | Story Builder | Creativity | Storytelling | Add ideas to build a surprising group story. |
| 3 | `escape-room` | Escape Room | Challenges | Collaborating | Explain clues clearly and solve them as a team. |
| 4 | `karaoke-corner` | Karaoke Corner | Performance | Performing | Sing with expression and introduce your song. |
| 5 | `trivia-challenge` | Trivia Challenge | Games | Responding | Discuss your answer before your team locks it in. |
| 6 | `speed-friending` | Speed Friending | Conversation | Active listening | Meet someone new and ask thoughtful follow-up questions. |
| 7 | `movie-dub` | Movie Dub | Performance | Performing | Create English dialogue for a short silent scene. |
| 8 | `english-board-games` | English Board Games | Games | Explaining | Play, negotiate and explain every move in English. |
| 9 | `voice-recording` | Voice Recording Booth | Performance | Speaking clearly | Record a confident message for the festival. |
| 10 | `accent-challenge` | Accent Challenge | Challenges | Pronunciation | Listen carefully and reproduce rhythm and expression. |
| 11 | `interview-booth` | Interview Booth | Conversation | Asking questions | Interview a partner and introduce them to the group. |
| 12 | `role-play-roulette` | Role Play Roulette | Performance | Responding | Adapt quickly to a surprise real-life situation. |
| 13 | `charades-plus` | Charades Plus | Games | Describing | Use clues, questions and descriptions to find the answer. |
| 14 | `emotion-theatre` | Emotion Theatre | Performance | Expression | Perform a scene using voice, emotion and body language. |
| 15 | `would-you-rather` | Would You Rather? | Conversation | Explaining | Choose, justify and respond to another point of view. |
| 16 | `debate-corner` | Debate Corner | Challenges | Persuading | Make a clear claim and support it with a reason. |
| 17 | `sell-it` | Sell It! | Creativity | Persuading | Pitch a mystery object with energy and detail. |
| 18 | `guess-who` | Guess Who? | Games | Describing | Ask precise questions to identify the mystery person. |
| 19 | `storytelling-booth` | Storytelling Booth | Creativity | Storytelling | Tell a vivid story with a beginning, middle and end. |
| 20 | `mystery-object` | Mystery Object | Challenges | Describing | Describe what you can feel without naming the object. |
| 21 | `poetry-mic` | Poetry Mic | Performance | Expression | Perform a short poem with pace, feeling and confidence. |
| 22 | `school-newsroom` | School Newsroom | Creativity | Explaining | Deliver a lively English news update as a team. |
| 23 | `picture-talk` | Picture Talk | Conversation | Describing | Notice details, make inferences and compare ideas. |
| 24 | `problem-solvers` | Problem Solvers | Challenges | Collaborating | Agree on a solution and explain your team's reasoning. |
| 25 | `find-someone-who` | Find Someone Who… | Conversation | Connecting | Move, mingle and discover something new about others. |

### 5.2 Milestone titles

Derived from confirmed stamp count, shown in the passport hero as **Current title**:

| Stamps | Title | Next milestone |
|---|---|---|
| 0–7 | Voice Explorer | 8 |
| 8–14 | Voice Adventurer | 15 |
| 15–24 | Confident Communicator | 25 |
| 25 | Voice Champion | — (complete) |

Progress copy: `"{next - count} more stamp{s} to your next milestone."`; at 25: `"Passport complete — you found your voice!"`

### 5.3 Screen — Student registration (`/`, no passport on device)

**Hero (navy gradient):** kicker `YOUR FESTIVAL JOURNEY STARTS HERE`, `h1` **My Voice Passport**, lead: *"Speak, connect and collect a digital stamp at every booth. Every conversation brings you one step closer to becoming a Voice Champion."* Three coral-dot stats: **Scan · Speak · Collect**.

**Form panel:** kicker `CREATE YOUR PASSPORT`, `h2` **Ready to find your voice?**, helper: *"Enter the school details your teacher will use to identify your participation. Your passport will stay linked to this device."*

| Field | Required | Validation |
|---|---|---|
| First name or nickname | Yes | 1–80 chars, trimmed |
| Student ID number | No | ≤ 40 chars; stored as "Not provided" when blank |
| Class | Yes | 1–40 chars, trimmed, uppercased for grouping (e.g. `2A`) |

Submit: **Open My Passport** (coral CTA). On submit: anonymous Supabase sign-in if no session, insert the `students` row, then render the dashboard. Toast: *"Your Voice Passport is ready!"*. Failure toast: *"We couldn't create your passport. Please try again."*

Footer on every page: **Every Voice Matters.** Every Conversation Counts.

### 5.4 Screen — Student passport dashboard (`/`, passport exists)

**Header:** brand lockup (K mark + `Find Your Voice` / `ENGLISH FESTIVAL DAY`). **No Booth QR Kit link.**

**Hero:** kicker `PERSONAL PARTICIPATION TRACKER`, `h1` `Hello, {firstName}!`, sub-line `{class} · ID {studentId} · Keep speaking, keep connecting.` (omit the ID segment when not provided). Right-hand **milestone card**: gold flag icon, label `CURRENT TITLE`, value = milestone title.

**Progress panel** (navy, full width): kicker `FESTIVAL PROGRESS`, `{n} of 25 booths`, right-aligned next-milestone line, and a progress bar (`value = n/25`, white track, coral fill).

**Booth stamp grid:** kicker `PARTICIPATION TRACKER`, `h2` **Your 25 booth stamps**, legend chip `Completed` (coral dot). Two columns on desktop, one on mobile. Each tile: two-digit number, booth name, skill sub-label, and a status disc:

| State | Tile |
|---|---|
| Not visited | Dashed `--line` border, muted text, outline mic icon |
| **Pending confirmation** | Gold border, `Waiting for facilitator` micro-label, gold clock icon |
| Confirmed | Solid coral-tinted border, navy text, coral check icon |

**Side stack:**
- **Tip card** — QR icon, kicker `AT EVERY BOOTH`, `h3` **Scan after you speak**, body: *"Complete the activity, ask the facilitator for the QR code, then collect your stamp."*
- **Skills card** — kicker `YOU ARE BUILDING`, checked list: Asking questions, Responding, Describing, Persuading, Storytelling, Collaborating.

**Personal learning record panel:** kicker `PERSONAL LEARNING RECORD`, `h2` **Capture what you discovered**, book icon.

| Field | Label | Placeholder | Control |
|---|---|---|---|
| `reflection` | Reflection | Today I felt more confident when… | textarea |
| `new_vocabulary` | New vocabulary | Write new words or expressions you heard… | textarea |
| `favourite_booth` | Favourite booth | Which booth did you enjoy most? | input |
| `speaking_goal` | Speaking goal | Next time, I will… | input |

Actions: **New passport** (ghost, rotate-ccw icon) and **Save learning record** (coral CTA, disabled while saving).

- Save → update own `students` row → toast *"Learning record saved."* / error *"Your reflection could not be saved."*
- New passport → `window.confirm("Start a new passport on this device? Your current record will remain stored, but this device will no longer be linked to it.")` → sign out of the anonymous session, sign in anonymously again, clear local state, return to registration. Toast *"Ready for a new passport."*

**Realtime:** subscribe to `stamps` and `checkin_requests` filtered to this `student_id`. A facilitator confirmation must flip the tile from pending to confirmed, bump the counter, advance the progress bar and (when crossing a threshold) the title — without a refresh. Fire a short coral confetti/pulse on the tile, suppressed under `prefers-reduced-motion`.

### 5.5 Flow — Booth check-in (`/?booth=<slug>`)

1. Student completes the activity and scans the printed booth card with the phone camera.
2. The link opens `/?booth=<slug>`. Unknown slug → ignore the param and show the normal dashboard.
3. **No passport yet:** show the registration form with a persistent note — *"Create your passport to collect your stamp for {Booth name}."* — and carry the booth through registration so the check-in card appears immediately afterwards.
4. **Passport exists:** pin a **check-in card** to the top of the dashboard: kicker `BOOTH {NN} SCANNED`, `h2` booth name, body = booth prompt, and a state-dependent action:

| State | Card | Button |
|---|---|---|
| No stamp, no pending request | Coral accent | **Request my stamp** |
| Pending | Gold accent, body replaced with *"Your facilitator is confirming this booth."* | Disabled — `Waiting for confirmation` |
| Confirmed | Green/confirmed accent, check icon | Disabled — `Stamp collected` |
| Previously rejected | Neutral | **Request again** |

5. Tapping **Request my stamp** inserts a pending `checkin_requests` row. Toast: *"Sent to your facilitator — hold on a moment."* The unique partial index means a duplicate tap is a no-op; surface *"You've already asked for this stamp."*
6. On confirmation (realtime), the card becomes `Stamp collected: {Booth name}` and the `booth` query param is stripped with `replaceState`.
7. On rejection: *"Your facilitator didn't confirm this one yet. Ask them and try again."*

### 5.6 Screen — Teacher login (`/teacher/login`)

Single card on the wash background, brand lockup on top. Tabs **Sign in** / **Sign up**.

- **Sign in:** email, password → `/teacher` on success.
- **Sign up:** name, email, password (min 8), **festival invite code**. On success, call `POST /api/teacher/claim` with the code; only then does the account become a facilitator. Copy: *"Create and verify a facilitator account for the private dashboard."*
- A signed-in account without a `teacher_profiles` row lands on a 403 card: *"This account does not have facilitator access."* with a **Enter invite code** action that retries the claim.
- Never reveal whether an email exists. Generic failure copy: *"We couldn't sign you in. Check your details and try again."*

### 5.7 Screen — Teacher dashboard (`/teacher`)

Header: `Festival Admin` / `Find Your Voice · English Festival Day`, links to **Student passport** and **Booth QR kit**, plus **Sign out**. Intro: kicker `LIVE PARTICIPATION DASHBOARD`, `h1` **Every booth. Every voice.**, lead: *"Monitor registrations, participation across all 25 booths, class activity and each student's festival journey."* Session card: `Signed in as {name or email}`.

**A. Pending check-in queue (new; top priority on mobile)**
Live list of `status = 'pending'` rows, oldest first, each showing student name, class, booth number + name, and the wait time. Actions **Confirm** (coral) and **Reject** (ghost) call `teacher_decide_checkin`. Optimistic UI with rollback on error. Empty state: *"No students waiting. Everything is confirmed."* Include a queue count badge and an audible/vibration cue toggle (off by default).

**B. KPI grid** — Registered students · Students participating · Total booth visits · Completed all 25 · Average booths per participant · Unique booths visited (`n / 25`). Alternate coral and navy accents.

**C. Participants at each booth** — kicker `ALL 25 BOOTHS`, one row per booth: two-digit number, name + skill, horizontal bar (width relative to the busiest booth), participant count and participation rate %. **Refresh** button.

**D. Participation by class** — per class: class name, `{participants}/{registered} participating`, `{visits} visits`. Empty: *"Class activity will appear after students register."*

**E. How counting works** note — kicker, `h2` **One stamp per student, per booth**, body: *"Scanning the same booth again will not increase participation, so booth totals remain accurate."*

**F. Student records** — search by name / student ID / class, filter by class, and **Export CSV**. Each row: initial avatar, name, `ID {studentId} · Class {class}`, `{n}/25 booths visited`, status chip (`Registered` / `Participating` / `Complete`), last activity, expander. Expanded: the booth list with confirmation timestamps and the student's learning record.

CSV filename `english-festival-participation.csv`, columns: `Student name, Student ID, Class, Booths visited, Completed, Last activity`. Quote-escape every field.

All panels update via realtime; a `Dashboard updated {relative time}` line sits under the grid.

### 5.8 Screen — Booth QR kit (`/teacher/booth-kit`, teacher only)

Intro (hidden when printing, class `no-print`): kicker `FACILITATOR RESOURCES`, `h1` **Booth QR Kit**, body: *"Print and place one card at each booth. Students complete the speaking activity, scan the booth's unique QR code, and collect their digital stamp."* Step strip: **1 Print · 2 Display · 3 Speak · 4 Scan**. Buttons: **Print QR Kit**, **Back to dashboard**.

One card per booth, in booth order:
- Top row: `BOOTH {NN}` + mic icon.
- QR: `qrcode.react` SVG, 148 px, `level="M"`, `bgColor="#ffffff"`, `fgColor="#0d2b45"` (navy — replaces the prototype's `#12282b`). Value: `${NEXT_PUBLIC_SITE_URL}/?booth=${booth.id}`, falling back to `window.location.origin` when the env var is absent.
- Booth name (`h2`), skill (uppercase coral kicker), prompt, and the footer line `Scan after completing the activity`.

**Print CSS:**

```css
@media print {
  @page { size: A4 portrait; margin: 10mm; }
  body { background: #fff !important; }
  .no-print { display: none !important; }
  .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8mm; width: 100%; }
  .qr-card {
    min-height: 126mm; box-shadow: none; page-break-inside: avoid;
    border: 1.5px solid var(--kaplan-navy); border-radius: 5mm; padding: 7mm;
  }
  .qr-code-wrap { margin: 7mm 0 5mm; }
}
```

Four cards per A4 sheet, 7 sheets for 25 booths. Verify a printed card scans from ~40 cm on a mid-range phone.

---

## 6. Non-functional requirements

- **Mobile-first.** Design at 360 px, then 768 px, then 1120 px (`.shell { width: min(1120px, calc(100% - 32px)) }`). Tap targets ≥ 44 px.
- **Accessibility.** WCAG 2.1 AA. Coral `#e5533d` on white is ~3.9:1 — use it for large text (≥ 24 px), icons and fills only; body copy uses `--ink` or `--muted`. Gold focus rings everywhere. Every stamp tile keeps `aria-label="{name}: {completed|pending|not completed}"`. Toasts announce via `aria-live="polite"`.
- **Performance.** Lighthouse ≥ 90 on mobile for Performance and ≥ 95 Accessibility. No webfonts, no analytics, no third-party scripts. Booth data is static and bundled.
- **Resilience.** Festival-day wifi is unreliable: retry failed writes once, keep the last-known passport in local state, and show a clear offline banner instead of an empty dashboard.
- **Privacy.** Only first name / nickname, optional student ID, and class are stored. No email, no photos, no free-text about other students beyond the learning record. Include a short data note in the footer of the registration screen: *"We only store your name, class and booth stamps for the festival."*
- **Security.** Service role key server-side only. No client write path to `stamps`. Invite code never shipped to the browser. Verify RLS by attempting a cross-student read with a second anonymous session before launch.

---

## 7. Repository

```
/
├─ app/
│  ├─ layout.tsx                 # brand lockup, footer, toast provider
│  ├─ globals.css                # Kaplan tokens + print styles
│  ├─ page.tsx                   # student passport (+ ?booth= handling)
│  ├─ not-found.tsx
│  ├─ teacher/
│  │  ├─ page.tsx                # dashboard
│  │  ├─ login/page.tsx
│  │  └─ booth-kit/page.tsx
│  └─ api/teacher/claim/route.ts
├─ components/                   # BrandHeader, StampTile, CheckinCard, ProgressPanel,
│                                # MilestoneCard, LearningRecord, PendingQueue, KpiGrid,
│                                # BoothBars, ClassList, StudentTable, QrCard, Toaster
├─ lib/
│  ├─ booths.ts                  # the 25 booths (frozen)
│  ├─ milestones.ts              # title thresholds
│  ├─ supabase-client.ts         # browser client
│  ├─ supabase-server.ts         # service-role client (server only)
│  ├─ passport.ts                # register / request check-in / save record
│  ├─ dashboard.ts               # aggregation + CSV
│  └─ types.ts
├─ supabase/schema.sql
├─ public/favicon.svg            # coral K mark
├─ .env.example
├─ netlify.toml
├─ README.md                     # setup, Supabase steps, deploy, festival-day runbook
└─ PRD.md                        # this document
```

**Replacing existing content:** the new app is written at the repo root. `Archive - do not use/` is excluded via `.gitignore` and must not be imported from or deleted — treat it as reference only. Everything else in the repo is superseded.

**Netlify:**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Set all five environment variables in Netlify → Site settings → Environment variables. `NEXT_PUBLIC_SITE_URL` must be the final production URL **before** the QR kit is printed.

**Git:** initialise (`git init`), first commit `feat: Kaplan Find Your Voice digital passport`, push to a new GitHub repo, connect Netlify to the repo, deploy from `main`.

---

## 8. Build sequence

1. Scaffold Next.js + TypeScript, `globals.css` with the Kaplan tokens, layout shell, brand header and footer.
2. `lib/booths.ts`, `lib/milestones.ts`, `lib/types.ts`.
3. Supabase project, run `schema.sql`, enable anonymous sign-ins, enable realtime on both tables.
4. Student registration + passport dashboard (read-only stamps).
5. `?booth=` check-in card and the pending request write path.
6. Teacher auth, invite-code claim route, route protection.
7. Teacher dashboard: pending queue + decision RPC, then KPIs, booth bars, class rollup, student table, CSV.
8. Realtime wiring on both sides; verify the student tile flips within 2 s.
9. Booth QR kit + print stylesheet; print a test sheet and scan it.
10. Accessibility, responsive and offline passes; Lighthouse.
11. Netlify deploy, env vars, smoke test on a real phone over mobile data.
12. Write the README runbook (booth setup, facilitator instructions, what to do if a student loses their device).

---

## 9. Acceptance criteria

- [ ] Registration with name + class only (no student ID) succeeds and the dashboard renders.
- [ ] Scanning a printed booth card on a phone opens the passport with the correct booth card pinned.
- [ ] **Request my stamp** creates exactly one pending request; a second tap does not duplicate it.
- [ ] A facilitator confirmation moves the tile to confirmed on the student's phone in under 2 seconds with no refresh.
- [ ] A rejection leaves no stamp and allows a fresh request.
- [ ] Direct `insert` into `stamps` from a student session is refused by RLS.
- [ ] `/teacher`, `/teacher/booth-kit` and the dashboard data are unreachable without a `teacher_profiles` row.
- [ ] Sign-up without the correct invite code does not grant facilitator access.
- [ ] The 8th confirmed stamp changes the title to **Voice Adventurer**; the 25th shows *"Passport complete — you found your voice!"*.
- [ ] Learning record persists across a reload on the same device.
- [ ] **New passport** starts an empty passport and leaves the previous record intact in the teacher dashboard.
- [ ] CSV exports every filtered student with correctly escaped fields.
- [ ] Print preview produces 4 cards per A4 page, no card split across pages, all 25 present.
- [ ] `grep -ri "skywork\|lovable\|data-lov\|skybase" .` (excluding `Archive - do not use/`) returns nothing.
- [ ] No colour outside the Kaplan token set appears in `globals.css`.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.

---

## 10. Open items for Kerri

1. **Invite code distribution** — who holds `TEACHER_INVITE_CODE` and how it reaches facilitators on the day.
2. **Booth count on the day** — the passport is hard-coded to 25. If a booth is dropped, the milestone thresholds (8/15/25) and the "of 25" copy need adjusting before printing.
3. **Custom domain** — whether the passport sits on a Netlify subdomain or a Kaplan domain. This must be settled before QR printing, since the URL is baked into the codes.
4. **Data retention** — how long student records are kept after the festival, and who deletes them.
5. **Kaplan logo asset** — the campaign site uses a plain coral "K" tile. Confirm whether the official Kaplan logo file should be used instead.
