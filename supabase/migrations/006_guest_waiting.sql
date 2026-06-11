-- Add status column to game_guests for 48h-window and capacity waiting list
alter table public.game_guests
  add column if not exists status text not null default 'active'
  check (status in ('active', 'waiting'));

-- Index for efficient status-filtered capacity queries
create index if not exists game_guests_game_status_idx
  on public.game_guests(game_id, status);

-- Update RLS: no change needed (existing policies cover all rows)
