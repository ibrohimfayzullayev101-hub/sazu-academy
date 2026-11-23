SAZU ACADEMY — ADMIN PANEL / SUPABASE SETUP

1) Open your Supabase project. In Project Settings > API, copy:
   - Project URL
   - anon/public key
2) Edit supabase-config.js and replace YOUR_SUPABASE_PROJECT_URL and
   YOUR_SUPABASE_ANON_KEY. Do not use the service_role key in website files.
3) In Supabase Dashboard > SQL Editor, run all contents of supabase-schema.sql.
4) In Supabase Authentication > Users, create your admin user with email/password.
   Disable public sign-ups in Authentication settings if you do not need public accounts.
5) Copy the created user's UUID. At the bottom of supabase-schema.sql, use:
   insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
   Run that statement in SQL Editor.
6) Deploy the whole folder to your web host. Open /admin.html and sign in.

CURRENT ADMIN FEATURES
- Supabase email/password authentication
- Dashboard counts and latest applications
- Create/edit/delete courses
- View applications, update status, delete applications
- Light/dark admin theme

IMPORTANT
- Never expose the Supabase service_role key in HTML, JS, GitHub, or Vercel client variables.
- Keep RLS enabled. The supplied schema allows public lead INSERT only; lead reading and
  management are restricted to admin users in admin_users.
- The public website form is still using its existing Telegram handoff in this version.
  To make applications appear in this dashboard, the public form must next be connected
  to Supabase INSERT on public.leads.
- Course management is connected to Supabase. Rendering the database-managed course list
  on the public home page is a separate next integration step.
