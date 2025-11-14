-- Migration: Create cities table for multi-tenant platform
-- Description: This table manages city configurations (themes, logos, database URLs) for the UrbanByte platform

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text default '#004AAD',
  secondary_color text default '#F5C842',
  accent_color text default '#FFFFFF',
  db_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add comment to table
comment on table public.cities is 'Stores configuration for each city/municipality using the platform';

-- Create index on slug for faster lookups
create index if not exists idx_cities_slug on public.cities(slug);
create index if not exists idx_cities_is_active on public.cities(is_active);

-- Enable RLS (Row Level Security)
alter table public.cities enable row level security;

-- Policy: Anyone can read active cities (for public theme endpoint)
create policy "Allow public read access to active cities"
  on public.cities
  for select
  using (is_active = true);

-- Policy: Only authenticated admins can insert/update/delete cities
create policy "Only admins can modify cities"
  on public.cities
  for all
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

-- Insert initial city: Afogados da Ingazeira
insert into public.cities (
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  is_active
) values (
  'Afogados da Ingazeira',
  'afogados-da-ingazeira',
  'https://hqhjbelcouanvcrqudbj.supabase.co/storage/v1/object/public/attachments/logo-afogados.png',
  '#004AAD',
  '#F5C842',
  '#FFFFFF',
  true
) on conflict (slug) do nothing;

-- Create function to update updated_at timestamp
create or replace function public.update_cities_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_cities_updated_at
  before update on public.cities
  for each row
  execute function public.update_cities_updated_at();
