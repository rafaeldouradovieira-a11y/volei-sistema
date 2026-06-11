-- Make name and phone nullable on profiles (phone moved to authorized_phones)
alter table public.profiles alter column name drop not null;
alter table public.profiles alter column phone drop not null;

-- Add avatar support to profiles
alter table public.profiles add column if not exists avatar_url text;

-- =============================================
-- Authorized phones (whitelist)
-- =============================================
create table if not exists public.authorized_phones (
  id           uuid    primary key default gen_random_uuid(),
  phone        text    not null unique,
  is_admin     boolean not null default false,
  invited_by_id uuid   references public.authorized_phones(id) on delete set null,
  display_name text,
  auth_user_id uuid    references auth.users(id) on delete set null,
  created_at   timestamp with time zone default now() not null
);

alter table public.authorized_phones enable row level security;

-- Authenticated users can view (needed for invited_by selector in admin panel)
create policy "Authenticated can view authorized phones" on public.authorized_phones
  for select using (auth.role() = 'authenticated');

-- Only admins can insert
create policy "Admins can insert authorized phones" on public.authorized_phones
  for insert with check (
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );

-- Only admins can update
create policy "Admins can update authorized phones" on public.authorized_phones
  for update using (
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );

-- Only admins can delete
create policy "Admins can delete authorized phones" on public.authorized_phones
  for delete using (
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );

-- =============================================
-- Unauthorized login attempts (admin notifications)
-- =============================================
create table if not exists public.unauthorized_attempts (
  id           uuid    primary key default gen_random_uuid(),
  phone        text    not null,
  attempted_at timestamp with time zone default now() not null
);

alter table public.unauthorized_attempts enable row level security;

-- Only admins can view attempts
create policy "Admins can view unauthorized attempts" on public.unauthorized_attempts
  for select using (
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );

-- =============================================
-- Supabase Storage: avatars bucket
-- =============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- First admin setup (run manually after migration):
-- insert into public.authorized_phones (phone, is_admin)
-- values ('11999999999', true);
-- (use digits only, no spaces or symbols)
-- =============================================
