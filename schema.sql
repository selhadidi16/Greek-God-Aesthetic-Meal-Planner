-- Greek God Aesthetic Meal Planner (PRO) schema

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','admin')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  height_ft int not null,
  height_in int not null check (height_in between 0 and 11),
  weight_lb numeric not null,
  sex text,
  age int,
  activity numeric not null,
  goal text not null check (goal in ('cut','maintain','bulk')),
  meals_per_day int not null check (meals_per_day in (3,4,5)),
  diet_type text not null check (diet_type in ('standard','high_protein','low_carb','vegetarian','vegan')),
  allergies text[] not null default '{}',
  preferred_protein text not null default 'No preference',
  avoid_food text not null default 'None',
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metrics_id uuid not null references public.client_metrics(id) on delete cascade,
  calories int not null,
  protein_g int not null,
  carbs_g int not null,
  fats_g int not null,
  plan_json jsonb not null,     -- includes 1-day or 7-day plan + grocery list
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_date date not null default (now()::date),
  weight_lb numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.trainer_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- trigger to create profile row after signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'client', coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.client_metrics enable row level security;
alter table public.meal_plans enable row level security;
alter table public.checkins enable row level security;
alter table public.trainer_notes enable row level security;

-- Helper: is admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin');
$$;

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_select_all" on public.profiles for select using (public.is_admin());

-- client_metrics
create policy "metrics_insert_own" on public.client_metrics for insert with check (auth.uid() = user_id);
create policy "metrics_select_own" on public.client_metrics for select using (auth.uid() = user_id);
create policy "metrics_admin_select_all" on public.client_metrics for select using (public.is_admin());

-- meal_plans
create policy "plans_insert_own" on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "plans_select_own" on public.meal_plans for select using (auth.uid() = user_id);
create policy "plans_admin_select_all" on public.meal_plans for select using (public.is_admin());
-- allow admin to insert plans for clients (macro tweak/regenerate)
create policy "plans_admin_insert_for_clients" on public.meal_plans for insert with check (public.is_admin());

-- checkins
create policy "checkins_insert_own" on public.checkins for insert with check (auth.uid() = user_id);
create policy "checkins_select_own" on public.checkins for select using (auth.uid() = user_id);
create policy "checkins_admin_select_all" on public.checkins for select using (public.is_admin());

-- trainer_notes
create policy "trainer_notes_admin_all" on public.trainer_notes
for all using (public.is_admin()) with check (public.is_admin());
