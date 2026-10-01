-- Datas das fases do campeonato (horários em America/Sao_Paulo)
alter table public.championships
  add column if not exists registration_start date,
  add column if not exists registration_end date,
  add column if not exists voting_end timestamp with time zone,
  add column if not exists draw_at timestamp with time zone;

-- Votação: nota de 1 a 5 de um inscrito para outro. "Pular" = sem linha.
create table if not exists public.championship_votes (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid references public.championships(id) on delete cascade not null,
  voter_id uuid references public.profiles(id) on delete cascade not null,
  candidate_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score between 1 and 5),
  created_at timestamp with time zone default now() not null,
  unique (championship_id, voter_id, candidate_id),
  check (voter_id <> candidate_id)
);

alter table public.championship_votes enable row level security;

-- Votos são secretos: cada um só enxerga os próprios. Os potes são calculados no servidor.
create policy "Voters can see their own votes" on public.championship_votes
  for select using (auth.uid() = voter_id);

create policy "Participants can vote" on public.championship_votes
  for insert with check (
    auth.uid() = voter_id and
    exists (
      select 1 from public.championship_participants cp
      where cp.championship_id = championship_votes.championship_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Voters can change their own votes" on public.championship_votes
  for update using (auth.uid() = voter_id);

create policy "Voters can remove their own votes" on public.championship_votes
  for delete using (auth.uid() = voter_id);
