# Fast deployment guide

## Supabase

1. Create project.
2. SQL Editor → run `supabase/schema.sql`.
3. Authentication → Providers → enable **Anonymous Sign-Ins**.
4. Authentication → Users → create teacher.
5. SQL Editor → add teacher UUID:

```sql
insert into public.teacher_profiles (user_id, display_name)
values ('AUTH-USER-UUID', 'Teacher Name');
```

5. Copy Project URL + publishable key.

## GitHub

1. Create empty repo.
2. Upload extracted project files to repository root.
3. Commit.

## Vercel

Import repo and add:

```text
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app
```

Deploy, then test:

1. Create student passport on phone A.
2. Open any `/booth/...` URL and request confirmation.
3. Sign in at `/teacher` on phone/laptop B.
4. Confirm.
5. Verify phone A updates and the home page shows the stamp.

## Important: make the student URL public

The QR kit should point to your stable production domain, for example:

```text
NEXT_PUBLIC_SITE_URL=https://pbep-digital-passport.vercel.app
```

Do not use a unique preview deployment URL such as `https://project-git-branch-team.vercel.app` or a deployment-specific URL.

In Vercel, check **Project Settings -> Deployment Protection**. Students must be able to access the Production deployment without Vercel Authentication. If Vercel Authentication is enabled for Production, disable it for Production or change the protection scope so Production is public.

After changing `NEXT_PUBLIC_SITE_URL`, redeploy before printing QR codes. Existing printed QR codes do not update automatically.
