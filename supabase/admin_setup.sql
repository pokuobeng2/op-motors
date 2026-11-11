-- Run this in Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/bnfxzhzqveczmyswoawu/sql/new)

-- 1. Immediately confirm the email for pokuobeng2@gmail.com (bypasses email link)
update auth.users
set email_confirmed_at = now()
where lower(email) = 'pokuobeng2@gmail.com';

-- 2. Ensure profile exists and is active
insert into public.profiles (id, full_name, email, is_active)
select id, coalesce(nullif(raw_user_meta_data->>'full_name', ''), 'Administrator'), email, true
from auth.users where lower(email) = 'pokuobeng2@gmail.com'
on conflict (id) do update set is_active = true, email = excluded.email;

-- 3. Ensure super_admin role is assigned in user_roles
insert into public.user_roles (user_id, role)
select id, 'super_admin'::public.app_role
from auth.users where lower(email) = 'pokuobeng2@gmail.com'
on conflict (user_id, role) do nothing;
