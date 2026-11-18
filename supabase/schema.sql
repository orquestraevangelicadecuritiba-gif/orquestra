-- ============================================================================
-- Orquestra Evangélica de Curitiba
-- Schema Supabase: Autenticação, Perfis de Músicos, Repertório Público e
-- Acervo Privado de Partituras (PDFs restritos a participantes liberados)
-- ============================================================================

-- 1. Extensões necessárias
create extension if not exists "pgcrypto";

-- 2. Tabela de Perfis de Músicos (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  instrument text not null,
  naipe text not null check (naipe in ('Cordas', 'Madeiras', 'Metais', 'Percussão & Base')),
  church text,
  experience_years text,
  notes text,
  access_status text not null default 'pending' check (access_status in ('pending', 'approved', 'rejected')),
  role text not null default 'musician' check (role in ('musician', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabela de Repertório (Público para audição)
create table if not exists public.repertoire (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  composer text not null,
  arranger text not null,
  category text not null,
  key_signature text not null,
  tempo_bpm integer not null default 76,
  duration_seconds integer not null default 210,
  audio_url text,
  description text,
  is_public boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- 4. Tabela de Partituras por Instrumento (Restrita a participantes aprovados)
create table if not exists public.sheet_music (
  id uuid primary key default gen_random_uuid(),
  repertoire_id uuid not null references public.repertoire(id) on delete cascade,
  instrument text not null,
  naipe text not null check (naipe in ('Cordas', 'Madeiras', 'Metais', 'Percussão & Base')),
  part_label text not null,
  file_path text not null,
  pages_count integer not null default 2,
  created_at timestamptz not null default now()
);

-- 5. Funções auxiliares SECURITY DEFINER (evitam recursão em políticas RLS)
create or replace function public.is_approved_participant()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (access_status = 'approved' or role = 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.get_my_access_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select access_status from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 6. Trigger para criar perfil automaticamente no cadastro (sempre começa como 'pending')
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    instrument,
    naipe,
    church,
    experience_years,
    notes,
    access_status,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'instrument', 'Violino I'),
    coalesce(new.raw_user_meta_data->>'naipe', 'Cordas'),
    new.raw_user_meta_data->>'church',
    new.raw_user_meta_data->>'experience_years',
    new.raw_user_meta_data->>'notes',
    'pending',
    'musician'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6b. Garantir perfil para usuários criados diretamente no painel do Supabase
insert into public.profiles (
  id,
  full_name,
  email,
  instrument,
  naipe,
  access_status,
  role
)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  coalesce(u.raw_user_meta_data->>'instrument', 'Grade Completa (Regência)'),
  coalesce(u.raw_user_meta_data->>'naipe', 'Percussão & Base'),
  case when lower(u.email) = 'orquestraevangelicadecuritiba@gmail.com' then 'approved' else 'pending' end,
  case when lower(u.email) = 'orquestraevangelicadecuritiba@gmail.com' then 'admin' else 'musician' end
from auth.users u
on conflict (id) do nothing;

-- 7. Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.repertoire enable row level security;
alter table public.sheet_music enable row level security;

-- Políticas de PROFILES
drop policy if exists "Músico lê o próprio perfil" on public.profiles;
create policy "Músico lê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Músico atualiza dados básicos próprios" on public.profiles;
create policy "Músico atualiza dados básicos próprios"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and access_status = public.get_my_access_status()
    and role = public.get_my_role()
  );

drop policy if exists "Coordenação gerencia todos os perfis" on public.profiles;
create policy "Coordenação gerencia todos os perfis"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Políticas de REPERTOIRE (Público para ouvir, Admin gerencia)
drop policy if exists "Repertório público para todos" on public.repertoire;
create policy "Repertório público para todos"
  on public.repertoire for select
  using (is_public = true or public.is_admin());

drop policy if exists "Coordenação gerencia repertório" on public.repertoire;
create policy "Coordenação gerencia repertório"
  on public.repertoire for all
  using (public.is_admin())
  with check (public.is_admin());

-- Políticas de SHEET_MUSIC (PDFs restritos somente a participantes liberados)
drop policy if exists "Partituras restritas a participantes liberados" on public.sheet_music;
create policy "Partituras restritas a participantes liberados"
  on public.sheet_music for select
  using (public.is_approved_participant());

drop policy if exists "Coordenação gerencia partituras" on public.sheet_music;
create policy "Coordenação gerencia partituras"
  on public.sheet_music for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8. Buckets do Supabase Storage
-- 'audios' = público (para ouvir o repertório)
-- 'partituras' = privado (somente participantes com access_status = 'approved')
insert into storage.buckets (id, name, public)
values ('audios', 'audios', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('partituras', 'partituras', false)
on conflict (id) do update set public = false;

-- Políticas de Storage para áudios públicos
drop policy if exists "Áudios públicos para leitura" on storage.objects;
create policy "Áudios públicos para leitura"
  on storage.objects for select
  using (bucket_id = 'audios');

drop policy if exists "Coordenação envia áudios" on storage.objects;
create policy "Coordenação envia áudios"
  on storage.objects for all
  using (bucket_id = 'audios' and public.is_admin())
  with check (bucket_id = 'audios' and public.is_admin());

-- Políticas de Storage para partituras PRIVADAS
drop policy if exists "Somente participantes liberados baixam partituras PDF" on storage.objects;
create policy "Somente participantes liberados baixam partituras PDF"
  on storage.objects for select
  using (
    bucket_id = 'partituras'
    and public.is_approved_participant()
  );

drop policy if exists "Coordenação envia e remove partituras PDF" on storage.objects;
create policy "Coordenação envia e remove partituras PDF"
  on storage.objects for all
  using (bucket_id = 'partituras' and public.is_admin())
  with check (bucket_id = 'partituras' and public.is_admin());

-- ============================================================================
-- 9. Dados iniciais de exemplo (Repertório Público)
-- ============================================================================
insert into public.repertoire (code, title, composer, arranger, category, key_signature, tempo_bpm, duration_seconds, description, sort_order)
values
  ('OEC-01', 'Grandioso És Tu (How Great Thou Art)', 'Carl Boberg · Stuart K. Hine', 'Arr. Orquestra Evangélica de Curitiba', 'Hinos Clássicos', 'Sib Maior', 72, 184, 'Abertura contemplativa em cordas graves, exposição do tema nas madeiras e entrada triunfal de trompas e trompetes no refrão final.', 1),
  ('OEC-02', 'Castelo Forte é Nosso Deus', 'Martinho Lutero', 'Arr. Coral Sinfônico OEC', 'Hinos Clássicos', 'Dó Maior', 84, 156, 'Coral clássico reformado com polifonia inspirada na tradição barroca, destacando contraponto de violoncelos, fagote e naipe de metais.', 2),
  ('OEC-03', 'Quão Grande é o Meu Deus', 'Chris Tomlin · Ed Cash', 'Arr. Sinfônico Curitiba', 'Louvor Sinfônico', 'Sol Maior', 76, 210, 'Construção dinâmica progressiva com ostinato de violinos II e viola, linha aérea de flauta transversal e ponte orquestral em tutti.', 3),
  ('OEC-04', 'Santo, Santo, Santo (Nicaea)', 'John Bacchus Dykes', 'Arr. Câmara de Curitiba', 'Suíte Orquestral', 'Mi Bemol Maior', 88, 168, 'Prelúdio de culto com diálogo antifonal entre fanfarra de metais e cordas em legato, encerrando com acorde sustentado em Mi bemol.', 4),
  ('OEC-05', 'Abertura Curitibana de Louvor (Suíte)', 'Composição Original OEC', 'Orquestra Evangélica de Curitiba', 'Suíte Orquestral', 'Ré Maior', 96, 242, 'Suíte em três breves movimentos reunindo temas tradicionais da igreja evangélica paranaense, com solos de oboé e trompa.', 5),
  ('OEC-06', 'Maravilhosa Graça (Amazing Grace)', 'John Newton · William Walker', 'Arr. Cordas & Madeiras OEC', 'Louvor Sinfônico', 'Fá Maior', 68, 192, 'Compasso ternário expressivo iniciado por violoncelo solo e clarinete em Bb, modulando um tom acima na estrofe final.', 6)
on conflict (code) do nothing;

-- ============================================================================
-- 10. Tornar sua conta Coordenação (Admin) após o primeiro cadastro no site:
-- update public.profiles set role = 'admin', access_status = 'approved'
-- where email = 'orquestraevangelicadecuritiba@gmail.com';
-- ============================================================================
