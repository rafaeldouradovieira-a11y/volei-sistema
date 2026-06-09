-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text not null,
  created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Games
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  date date not null,
  time time not null,
  location text not null,
  court text,
  duration_hours numeric(3,1) not null,
  max_players integer not null,
  price_total numeric(10,2),
  pix_key text,
  status text not null default 'active' check (status in ('active', 'closed', 'cancelled')),
  created_at timestamp with time zone default now() not null
);

alter table public.games enable row level security;

create policy "Games are viewable by everyone" on public.games
  for select using (true);

create policy "Authenticated users can create games" on public.games
  for insert with check (auth.uid() = organizer_id);

create policy "Organizer can update their game" on public.games
  for update using (auth.uid() = organizer_id);

-- Game participants
create table if not exists public.game_participants (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default now() not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'confirmed')),
  unique(game_id, user_id)
);

alter table public.game_participants enable row level security;

create policy "Participants are viewable by everyone" on public.game_participants
  for select using (true);

create policy "Authenticated users can join games" on public.game_participants
  for insert with check (auth.uid() = user_id);

create policy "Users can leave games" on public.game_participants
  for delete using (auth.uid() = user_id);

create policy "Organizer can update payment status" on public.game_participants
  for update using (
    auth.uid() = user_id or
    auth.uid() = (select organizer_id from public.games where id = game_id)
  );

-- Waiting list
create table if not exists public.waiting_list (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default now() not null,
  unique(game_id, user_id)
);

alter table public.waiting_list enable row level security;

create policy "Waiting list is viewable by everyone" on public.waiting_list
  for select using (true);

create policy "Authenticated users can join waiting list" on public.waiting_list
  for insert with check (auth.uid() = user_id);

create policy "Users can leave waiting list" on public.waiting_list
  for delete using (auth.uid() = user_id);

-- Trigger: auto-create profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Profile is created manually after signup with name + phone
  return new;
end;
$$ language plpgsql security definer;
