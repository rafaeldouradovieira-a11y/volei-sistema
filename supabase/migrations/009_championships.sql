-- Championships (campeonatos): list of events with a check-in ("Inscrição") sub-section
create table if not exists public.championships (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  date date,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamp with time zone default now() not null
);

alter table public.championships enable row level security;

create policy "Championships are viewable by everyone" on public.championships
  for select using (true);

create policy "Admins can create championships" on public.championships
  for insert with check (
    auth.uid() = organizer_id and
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );

create policy "Admins can update championships" on public.championships
  for update using (
    exists (
      select 1 from public.authorized_phones ap
      where ap.auth_user_id = auth.uid() and ap.is_admin = true
    )
  );

-- Championship check-ins
create table if not exists public.championship_participants (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid references public.championships(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default now() not null,
  unique(championship_id, user_id)
);

alter table public.championship_participants enable row level security;

create policy "Championship check-ins are viewable by everyone" on public.championship_participants
  for select using (true);

create policy "Authenticated users can check in" on public.championship_participants
  for insert with check (auth.uid() = user_id);

create policy "Users can remove their own check-in" on public.championship_participants
  for delete using (auth.uid() = user_id);
