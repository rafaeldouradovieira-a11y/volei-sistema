-- Payment proof columns
alter table public.game_participants add column if not exists proof_url text;
alter table public.game_guests        add column if not exists proof_url text;

-- Storage bucket for proofs
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'proofs public read'
  ) then
    create policy "proofs public read" on storage.objects
      for select using (bucket_id = 'proofs');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'proofs upload'
  ) then
    create policy "proofs upload" on storage.objects
      for insert with check (bucket_id = 'proofs' and auth.uid() is not null);
  end if;
end $$;

-- Matches
create table if not exists public.matches (
  id         uuid        primary key default gen_random_uuid(),
  game_id    uuid        references public.games(id) on delete cascade not null,
  started_by uuid        references public.profiles(id) not null,
  team1      jsonb       not null default '[]'::jsonb,
  team2      jsonb       not null default '[]'::jsonb,
  score1     int         not null default 0,
  score2     int         not null default 0,
  winner     int,
  status     text        not null default 'live',
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  constraint matches_status_check check (status in ('live', 'finished')),
  constraint matches_winner_check check (winner in (1, 2))
);

-- Only one live match per game at a time
create unique index if not exists matches_one_live_per_game
  on public.matches(game_id) where status = 'live';

alter table public.matches enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches viewable by all') then
    create policy "matches viewable by all" on public.matches for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches insertable by auth') then
    create policy "matches insertable by auth" on public.matches
      for insert with check (auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches updatable by starter') then
    create policy "matches updatable by starter" on public.matches
      for update using (started_by = auth.uid());
  end if;
end $$;

-- Match wins for ranking (only registered participants)
create table if not exists public.match_wins (
  id        uuid        primary key default gen_random_uuid(),
  match_id  uuid        references public.matches(id) on delete cascade not null,
  player_id uuid        references public.profiles(id) on delete cascade not null,
  played_at timestamptz not null default now(),
  unique (match_id, player_id)
);

alter table public.match_wins enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='match_wins' and policyname='match_wins viewable by all') then
    create policy "match_wins viewable by all" on public.match_wins for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='match_wins' and policyname='match_wins insertable by auth') then
    create policy "match_wins insertable by auth" on public.match_wins
      for insert with check (auth.uid() is not null);
  end if;
end $$;

-- Enable realtime for live score updates
alter publication supabase_realtime add table public.matches;
