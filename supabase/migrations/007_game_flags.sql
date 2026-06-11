-- Flexible check-in and leave rules per game
alter table public.games
  add column if not exists allow_late_checkin boolean not null default false,
  add column if not exists allow_early_leave boolean not null default false;
