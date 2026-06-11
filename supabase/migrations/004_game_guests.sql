create table if not exists public.game_guests (
  id             uuid    primary key default gen_random_uuid(),
  game_id        uuid    references public.games(id) on delete cascade not null,
  invited_by     uuid    references public.profiles(id) on delete cascade not null,
  name           text    not null,
  payment_status text    not null default 'pending'
                         check (payment_status in ('pending', 'confirmed')),
  joined_at      timestamp with time zone default now() not null
);

alter table public.game_guests enable row level security;

create policy "Guests are viewable by everyone" on public.game_guests
  for select using (true);

create policy "Participants can add guests" on public.game_guests
  for insert with check (auth.uid() = invited_by);

create policy "Inviters and organizer can remove guests" on public.game_guests
  for delete using (
    auth.uid() = invited_by or
    auth.uid() = (select organizer_id from public.games where id = game_id)
  );

create policy "Organizer and inviter can update guest payment" on public.game_guests
  for update using (
    auth.uid() = invited_by or
    auth.uid() = (select organizer_id from public.games where id = game_id)
  );
