-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create teams table
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  team_name text not null,
  captain_name text not null,
  contact_email text not null,
  contact_phone text not null,
  file_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create team_members table
create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  age integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies for teams
create policy "Teams are viewable by everyone"
  on public.teams for select
  using (true);

create policy "Teams are insertable by authenticated users"
  on public.teams for insert
  with check (auth.role() = 'authenticated');

create policy "Teams are updatable by admins"
  on public.teams for update
  using (auth.role() = 'authenticated' and auth.uid() in (
    select id from auth.users where raw_user_meta_data->>'role' = 'admin'
  ));

-- Create RLS policies for team_members
create policy "Team members are viewable by everyone"
  on public.team_members for select
  using (true);

create policy "Team members are insertable by authenticated users"
  on public.team_members for insert
  with check (auth.role() = 'authenticated');

-- Create a function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
    and raw_user_meta_data->>'role' = 'admin'
  );
$$ language sql security definer;

-- Create a view for admin dashboard
create or replace view public.team_registrations as
select 
  t.*,
  json_agg(
    json_build_object(
      'id', tm.id,
      'name', tm.name,
      'age', tm.age,
      'created_at', tm.created_at
    )
  ) as members
from public.teams t
left join public.team_members tm on t.id = tm.team_id
group by t.id;

-- Create indexes for better performance
create index idx_teams_created_at on public.teams(created_at);
create index idx_team_members_team_id on public.team_members(team_id);
