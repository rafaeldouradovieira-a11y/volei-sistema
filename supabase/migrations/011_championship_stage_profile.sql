-- Etapa do campeonato: inscrição > votação > sorteio > tabela > jogos
alter table public.championships
  add column if not exists stage text not null default 'registration'
  check (stage in ('registration', 'voting', 'draw', 'table', 'games'));

-- Perfil do jogador (exigido na inscrição do campeonato). A foto usa profiles.avatar_url.
alter table public.profiles
  add column if not exists age integer check (age between 5 and 100),
  add column if not exists height_cm integer check (height_cm between 100 and 250),
  add column if not exists weight_kg numeric(5,1) check (weight_kg between 20 and 300),
  add column if not exists gender text check (gender in ('F', 'M'));
