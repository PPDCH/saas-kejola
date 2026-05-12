-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type tenant_type as enum ('PPD', 'SEKOLAH');
create type tenant_status as enum ('ACTIVE', 'SUSPENDED');
create type user_role as enum ('PLATFORM_OWNER', 'SUPERADMIN', 'ADMIN', 'HAKIM');
create type event_status as enum ('DRAFT', 'OPEN', 'CLOSED', 'ONGOING', 'COMPLETED');
create type acara_jenis as enum ('TREK', 'PADANG', 'REJANG');
create type acara_jantina as enum ('L', 'P');
create type acara_kategori as enum ('B12', 'B14', 'B16', 'B18', 'TERBUKA');
create type acara_unit as enum ('MASA_MS', 'JARAK_MM', 'KETINGGIAN_MM');
create type arah_terbaik as enum ('RENDAH', 'TINGGI');
create type acara_status as enum ('UPCOMING', 'ONGOING', 'COMPLETED');
create type pendaftaran_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type heat_round as enum ('HEAT', 'SEMIFINAL', 'FINAL');
create type heat_status as enum ('UPCOMING', 'ONGOING', 'COMPLETED');
create type result_status as enum ('COMPLETED', 'DNF', 'DNS', 'DQ');
create type sijil_type as enum ('EMAS', 'PERAK', 'GANGSA', 'HADIR');
create type jantina as enum ('L', 'P');
create type peringkat_type as enum ('SEKOLAH', 'MSSD', 'MSSN', 'MSSM');

-- Tenants
create table tenants (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  type        tenant_type not null,
  status      tenant_status not null default 'ACTIVE',
  created_at  timestamp with time zone default now()
);

-- Users (extends Supabase auth.users)
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid references tenants(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        user_role not null default 'ADMIN',
  status      text not null default 'ACTIVE',
  created_at  timestamp with time zone default now()
);

-- Schools
create table schools (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid references tenants(id) on delete cascade,
  name          text not null,
  code          text,
  admin_user_id uuid references users(id),
  created_at    timestamp with time zone default now()
);

-- Events
create table events (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid references tenants(id) on delete cascade,
  name        text not null,
  peringkat   peringkat_type not null default 'MSSD',
  location    text,
  date_start  date not null,
  date_end    date not null,
  status      event_status not null default 'DRAFT',
  created_by  uuid references users(id),
  created_at  timestamp with time zone default now()
);

-- Event Acara
create table event_acara (
  id                    uuid primary key default uuid_generate_v4(),
  event_id              uuid references events(id) on delete cascade,
  nama_acara            text not null,
  jenis                 acara_jenis not null,
  jantina               acara_jantina not null,
  kategori              acara_kategori not null,
  unit                  acara_unit not null default 'MASA_MS',
  max_peserta_sekolah   int not null default 2,
  arah_terbaik          arah_terbaik not null default 'RENDAH',
  bilangan_heat         int not null default 1,
  hakim_user_id         uuid references users(id),
  status                acara_status not null default 'UPCOMING'
);

-- Athletes
create table athletes (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid references tenants(id) on delete cascade,
  school_id     uuid references schools(id) on delete cascade,
  name          text not null,
  ic_number     text not null,
  tarikh_lahir  date not null,
  jantina       jantina not null,
  kategori      acara_kategori,
  created_at    timestamp with time zone default now()
);

-- Registrations
create table registrations (
  id              uuid primary key default uuid_generate_v4(),
  event_acara_id  uuid references event_acara(id) on delete cascade,
  athlete_id      uuid references athletes(id) on delete cascade,
  school_id       uuid references schools(id) on delete cascade,
  status          pendaftaran_status not null default 'PENDING',
  note            text,
  created_at      timestamp with time zone default now(),
  unique(event_acara_id, athlete_id)
);

-- Heats
create table heats (
  id              uuid primary key default uuid_generate_v4(),
  event_acara_id  uuid references event_acara(id) on delete cascade,
  heat_number     int not null,
  round           heat_round not null default 'HEAT',
  status          heat_status not null default 'UPCOMING'
);

-- Heat Lanes
create table heat_lanes (
  id          uuid primary key default uuid_generate_v4(),
  heat_id     uuid references heats(id) on delete cascade,
  athlete_id  uuid references athletes(id) on delete cascade,
  lane_number int not null
);

-- Results
create table results (
  id              uuid primary key default uuid_generate_v4(),
  heat_lane_id    uuid references heat_lanes(id) on delete cascade,
  value           bigint,
  wind_reading    decimal(4,1),
  status          result_status not null default 'COMPLETED',
  submitted_by    uuid references users(id),
  submitted_at    timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

-- Rankings
create table rankings (
  id              uuid primary key default uuid_generate_v4(),
  event_acara_id  uuid references event_acara(id) on delete cascade,
  athlete_id      uuid references athletes(id) on delete cascade,
  school_id       uuid references schools(id) on delete cascade,
  kedudukan       int,
  nilai_terbaik   bigint,
  mata            int default 0,
  sijil           sijil_type default 'HADIR',
  unique(event_acara_id, athlete_id)
);

-- School Standings
create table school_standings (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid references events(id) on delete cascade,
  school_id   uuid references schools(id) on delete cascade,
  total_mata  int default 0,
  emas        int default 0,
  perak       int default 0,
  gangsa      int default 0,
  ranking     int,
  unique(event_id, school_id)
);
