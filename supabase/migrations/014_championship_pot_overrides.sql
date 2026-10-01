-- Ajustes manuais do admin: mover um homem para outro pote (A, B ou C).
-- Sem linha = pote automático (pela votação).
create table if not exists public.championship_pot_overrides (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid references public.championships(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pot text not null check (pot in ('A', 'B', 'C')),
  unique (championship_id, user_id)
);

alter table public.championship_pot_overrides enable row level security;

-- Os potes são públicos depois da votação; escrita só pelo servidor (service role)
create policy "Pot overrides are viewable by everyone" on public.championship_pot_overrides
  for select using (true);
