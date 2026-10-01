-- Times sorteados do campeonato (escritos só pelo servidor, com a service role)
create table if not exists public.championship_teams (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid references public.championships(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.championship_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.championship_teams(id) on delete cascade not null,
  championship_id uuid references public.championships(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pot text not null check (pot in ('girls', 'A', 'B', 'C')),
  unique (championship_id, user_id)
);

alter table public.championship_teams enable row level security;
alter table public.championship_team_members enable row level security;

create policy "Championship teams are viewable by everyone" on public.championship_teams
  for select using (true);

create policy "Championship team members are viewable by everyone" on public.championship_team_members
  for select using (true);
