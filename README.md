# My Voice Passport

A mobile-first English festival web app inspired by a digital “voice passport” experience. Students scan booth QR codes, complete speaking challenges, request confirmation, and receive stamps only after a teacher approves them.

## Included

- Student passport stored on the device
- 8 editable speaking booths
- Printable QR booth kit
- Supabase database backend
- Supabase email/password teacher login
- Teacher confirmation queue
- Confirm/decline workflow
- Confirmed stamp history
- Realtime page updates after teacher approval
- Responsive mobile UI
- Vercel-ready Next.js App Router project

## 1. Run locally

Requirements: current Node.js LTS and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## 2. Create Supabase project

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. In **Project Settings > API**, copy:
   - Project URL
   - Publishable key (or legacy anon key)
5. Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Create a teacher account

In Supabase Dashboard:

1. Go to **Authentication > Users**.
2. Create/invite the teacher user with email + password.
3. Copy that user's UUID.
4. Run this in SQL Editor, replacing the UUID and name:

```sql
insert into public.teacher_profiles (user_id, display_name)
values ('PASTE-AUTH-USER-UUID-HERE', 'Festival Teacher');
```

The teacher can now sign in at `/teacher`.

Important: creating an Auth user alone does **not** grant teacher confirmation rights. The UUID must also exist in `teacher_profiles`.

## 4. Customize booths

Edit `lib/booths.ts`.

Each booth has:

```ts
{
  id: "booth-1",
  slug: "hello-hub",
  title: "Hello Hub",
  prompt: "...",
  helper: "...",
  emoji: "👋"
}
```

Keep `slug` unique. Changing a slug after the event starts will make it a new booth from the database's point of view.

## 5. Deploy to GitHub + Vercel

### GitHub manual upload

1. Create a new empty GitHub repository.
2. Extract this project ZIP.
3. Upload all files/folders to the repository root.
4. Commit the files.

Do **not** upload `.env.local`.

### Vercel

1. In Vercel, click **Add New > Project**.
2. Import the GitHub repository.
3. Vercel should detect Next.js automatically.
4. Add these environment variables under **Project Settings > Environment Variables**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Set `NEXT_PUBLIC_SITE_URL` to your final Vercel URL, e.g. `https://voice-passport.vercel.app`.

5. Deploy.

The QR kit uses the browser's current origin, so QR codes on the deployed `/booth-kit` page automatically point at the deployed domain.

## Event flow

### Student

1. Opens `/` and creates a passport.
2. Scans a printed booth QR code.
3. Completes the speaking challenge.
4. Taps **Request teacher confirmation**.
5. Waits at the booth.
6. Teacher approves.
7. The booth page updates and the home passport displays the stamp.

### Teacher

1. Opens `/teacher`.
2. Signs in.
3. Sees pending students grouped by booth.
4. Watches/listens to the student's task.
5. Taps **Confirm** or **Decline**.

## Security model and privacy note

The app intentionally avoids a service-role/secret Supabase key in the browser. Teacher approval is enforced in Postgres through a `SECURITY DEFINER` database function that checks whether the logged-in Supabase Auth user exists in `teacher_profiles`.

This starter stores only first name/nickname, student ID/code, class, booth requests and stamps. Student devices use Supabase Anonymous Auth, and RLS restricts each student to their own student/check-in/stamp rows. Approved teachers can read the event queue and confirm requests.

For a school production environment, consider using pseudonymous event codes instead of institutional student IDs if your privacy policy does not require the real identifier. Review your organization's privacy/data-retention policy before a live event.

## Recommended pre-event checklist

- Create the Supabase project, run the schema, and enable Anonymous Sign-Ins.
- Add at least one teacher Auth account and `teacher_profiles` row.
- Deploy to Vercel.
- Open `/booth-kit` on the **deployed** site and print the QR cards.
- Test one complete student flow on a phone.
- Confirm the teacher can approve a request from another device.
- Decide whether “Student ID” should be replaced with an event-only participant code.
- Test venue Wi-Fi/mobile connectivity.

## Project structure

```text
app/
  page.tsx              Student passport
  booth-kit/page.tsx    Printable QR kit
  booth/[slug]/page.tsx Booth challenge
  teacher/page.tsx      Teacher login + live queue
components/
lib/
supabase/schema.sql
```

## Troubleshooting

**Teacher logs in but cannot confirm**  
Add the Auth user's UUID to `public.teacher_profiles`.

**QR codes point to localhost**  
Open `/booth-kit` on your deployed Vercel URL before printing. The component replaces the fallback URL with `window.location.origin`.

**Student request does not update automatically**  
Check that `checkin_requests` is enabled in Supabase Realtime. The schema attempts to add it to the realtime publication.

**`alter publication ... add table` says the table is already a member**  
That just means Realtime was already enabled. You can ignore that final statement or remove it and run the rest of the schema.
