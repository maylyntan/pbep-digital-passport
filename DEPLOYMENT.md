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
