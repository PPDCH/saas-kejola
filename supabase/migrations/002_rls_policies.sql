-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table users enable row level security;
alter table schools enable row level security;
alter table events enable row level security;
alter table event_acara enable row level security;
alter table athletes enable row level security;
alter table registrations enable row level security;
alter table heats enable row level security;
alter table heat_lanes enable row level security;
alter table results enable row level security;
alter table rankings enable row level security;
alter table school_standings enable row level security;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Dapatkan tenant_id user semasa
create or replace function get_my_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from users where id = auth.uid()
$$;

-- Dapatkan role user semasa
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role::text from users where id = auth.uid()
$$;

-- Semak sama ada user adalah PLATFORM_OWNER
create or replace function is_platform_owner()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'PLATFORM_OWNER'
  )
$$;

-- ============================================
-- TENANTS
-- ============================================

-- Sesiapa boleh baca tenant aktif (untuk tenant resolver)
create policy "tenants_read_active"
  on tenants for select
  using (status = 'ACTIVE');

-- Hanya PLATFORM_OWNER boleh insert/update
create policy "tenants_write_platform_owner"
  on tenants for all
  using (is_platform_owner())
  with check (is_platform_owner());

-- ============================================
-- USERS
-- ============================================

-- User boleh baca profil sendiri
create policy "users_read_own"
  on users for select
  using (
    id = auth.uid()
    or tenant_id = get_my_tenant_id()
    or is_platform_owner()
  );

-- PLATFORM_OWNER boleh insert user baru
create policy "users_insert_platform_owner"
  on users for insert
  with check (is_platform_owner());

-- User boleh update profil sendiri; PLATFORM_OWNER boleh update semua
create policy "users_update"
  on users for update
  using (id = auth.uid() or is_platform_owner());

-- ============================================
-- SCHOOLS
-- ============================================

-- Semua user dalam tenant yang sama boleh baca
create policy "schools_read_same_tenant"
  on schools for select
  using (tenant_id = get_my_tenant_id() or is_platform_owner());

-- Hanya SUPERADMIN/PLATFORM_OWNER boleh tulis
create policy "schools_write_admin"
  on schools for all
  using (
    is_platform_owner()
    or (tenant_id = get_my_tenant_id() and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER'))
  )
  with check (
    is_platform_owner()
    or (tenant_id = get_my_tenant_id() and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER'))
  );

-- ============================================
-- EVENTS
-- ============================================

-- Semua user dalam tenant boleh baca event
create policy "events_read_same_tenant"
  on events for select
  using (tenant_id = get_my_tenant_id() or is_platform_owner());

-- Hanya SUPERADMIN/PLATFORM_OWNER boleh cipta/edit event
create policy "events_write_admin"
  on events for all
  using (
    is_platform_owner()
    or (tenant_id = get_my_tenant_id() and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER'))
  )
  with check (
    is_platform_owner()
    or (tenant_id = get_my_tenant_id() and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER'))
  );

-- ============================================
-- EVENT_ACARA
-- ============================================

-- Semua user dalam tenant boleh baca
create policy "event_acara_read_same_tenant"
  on event_acara for select
  using (
    exists (
      select 1 from events e
      where e.id = event_acara.event_id
      and (e.tenant_id = get_my_tenant_id() or is_platform_owner())
    )
  );

-- SUPERADMIN+ dan HAKIM yang di-assign boleh tulis
create policy "event_acara_write_admin"
  on event_acara for all
  using (
    is_platform_owner()
    or exists (
      select 1 from events e
      where e.id = event_acara.event_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from events e
      where e.id = event_acara.event_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER')
    )
  );

-- ============================================
-- ATHLETES
-- ============================================

-- Semua user dalam tenant boleh baca
create policy "athletes_read_same_tenant"
  on athletes for select
  using (tenant_id = get_my_tenant_id() or is_platform_owner());

-- ADMIN boleh tambah atlet sekolah sendiri; SUPERADMIN+ boleh semua
create policy "athletes_write"
  on athletes for all
  using (
    is_platform_owner()
    or (tenant_id = get_my_tenant_id() and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN'))
  )
  with check (
    is_platform_owner()
    or (tenant_id = get_my_tenant_id() and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN'))
  );

-- ============================================
-- REGISTRATIONS
-- ============================================

-- Semua user dalam tenant boleh baca
create policy "registrations_read_same_tenant"
  on registrations for select
  using (
    is_platform_owner()
    or exists (
      select 1 from athletes a
      where a.id = registrations.athlete_id
      and a.tenant_id = get_my_tenant_id()
    )
  );

-- ADMIN+ boleh daftar; SUPERADMIN+ boleh approve/reject
create policy "registrations_write"
  on registrations for all
  using (
    is_platform_owner()
    or exists (
      select 1 from athletes a
      where a.id = registrations.athlete_id
      and a.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from athletes a
      where a.id = registrations.athlete_id
      and a.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN')
    )
  );

-- ============================================
-- HEATS & HEAT_LANES
-- ============================================

create policy "heats_read_same_tenant"
  on heats for select
  using (
    is_platform_owner()
    or exists (
      select 1 from event_acara ea
      join events e on e.id = ea.event_id
      where ea.id = heats.event_acara_id
      and e.tenant_id = get_my_tenant_id()
    )
  );

create policy "heats_write_admin"
  on heats for all
  using (
    is_platform_owner()
    or exists (
      select 1 from event_acara ea
      join events e on e.id = ea.event_id
      where ea.id = heats.event_acara_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from event_acara ea
      join events e on e.id = ea.event_id
      where ea.id = heats.event_acara_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER')
    )
  );

create policy "heat_lanes_read_same_tenant"
  on heat_lanes for select
  using (
    is_platform_owner()
    or exists (
      select 1 from heats h
      join event_acara ea on ea.id = h.event_acara_id
      join events e on e.id = ea.event_id
      where h.id = heat_lanes.heat_id
      and e.tenant_id = get_my_tenant_id()
    )
  );

create policy "heat_lanes_write_admin"
  on heat_lanes for all
  using (
    is_platform_owner()
    or exists (
      select 1 from heats h
      join event_acara ea on ea.id = h.event_acara_id
      join events e on e.id = ea.event_id
      where h.id = heat_lanes.heat_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from heats h
      join event_acara ea on ea.id = h.event_acara_id
      join events e on e.id = ea.event_id
      where h.id = heat_lanes.heat_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER')
    )
  );

-- ============================================
-- RESULTS
-- ============================================

-- Semua user dalam tenant boleh baca
create policy "results_read_same_tenant"
  on results for select
  using (
    is_platform_owner()
    or exists (
      select 1 from heat_lanes hl
      join heats h on h.id = hl.heat_id
      join event_acara ea on ea.id = h.event_acara_id
      join events e on e.id = ea.event_id
      where hl.id = results.heat_lane_id
      and e.tenant_id = get_my_tenant_id()
    )
  );

-- HAKIM, SUPERADMIN, PLATFORM_OWNER boleh input keputusan
create policy "results_write_hakim"
  on results for all
  using (
    is_platform_owner()
    or exists (
      select 1 from heat_lanes hl
      join heats h on h.id = hl.heat_id
      join event_acara ea on ea.id = h.event_acara_id
      join events e on e.id = ea.event_id
      where hl.id = results.heat_lane_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('HAKIM', 'SUPERADMIN', 'PLATFORM_OWNER')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from heat_lanes hl
      join heats h on h.id = hl.heat_id
      join event_acara ea on ea.id = h.event_acara_id
      join events e on e.id = ea.event_id
      where hl.id = results.heat_lane_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('HAKIM', 'SUPERADMIN', 'PLATFORM_OWNER')
    )
  );

-- ============================================
-- RANKINGS & SCHOOL_STANDINGS (PUBLIC READ)
-- ============================================

-- Rankings boleh dibaca oleh semua orang (termasuk tanpa login — untuk leaderboard)
create policy "rankings_public_read"
  on rankings for select
  using (true);

create policy "rankings_write_admin"
  on rankings for all
  using (
    is_platform_owner()
    or exists (
      select 1 from event_acara ea
      join events e on e.id = ea.event_id
      where ea.id = rankings.event_acara_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'HAKIM')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from event_acara ea
      join events e on e.id = ea.event_id
      where ea.id = rankings.event_acara_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'HAKIM')
    )
  );

create policy "school_standings_public_read"
  on school_standings for select
  using (true);

create policy "school_standings_write_admin"
  on school_standings for all
  using (
    is_platform_owner()
    or exists (
      select 1 from events e
      where e.id = school_standings.event_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'HAKIM')
    )
  )
  with check (
    is_platform_owner()
    or exists (
      select 1 from events e
      where e.id = school_standings.event_id
      and e.tenant_id = get_my_tenant_id()
      and get_my_role() in ('SUPERADMIN', 'PLATFORM_OWNER', 'HAKIM')
    )
  );
