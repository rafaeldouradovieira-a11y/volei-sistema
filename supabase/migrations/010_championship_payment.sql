-- Championship logistics (time, location, court) and payment config
alter table public.championships
  add column if not exists time time,
  add column if not exists location text,
  add column if not exists court text,
  add column if not exists price_per_person numeric(10,2),
  add column if not exists pix_key text;

-- Check-in payment tracking (mirrors game_participants)
alter table public.championship_participants
  add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'confirmed')),
  add column if not exists proof_url text;

create policy "Self and admins can update check-in payment" on public.championship_participants
  for update using (
    auth.uid() = user_id or
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );
