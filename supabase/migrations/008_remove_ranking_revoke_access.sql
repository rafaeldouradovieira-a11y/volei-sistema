-- Ranking removido do sistema
drop table if exists public.match_wins;

-- Permite excluir o auth.user ao remover da whitelist (revogação de acesso):
-- partidas iniciadas pela pessoa ficam com started_by nulo em vez de bloquear a exclusão
alter table public.matches alter column started_by drop not null;
alter table public.matches drop constraint if exists matches_started_by_fkey;
alter table public.matches add constraint matches_started_by_fkey
  foreign key (started_by) references public.profiles(id) on delete set null;
