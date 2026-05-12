# Kejola SaaS — Design Document
*Sistem Pengurusan Kejohanan Olahraga Sekolah Malaysia*

---

## 1. Ringkasan Projek

Kejola adalah platform SaaS multi-tenant untuk mengurus kejohanan olahraga sekolah di Malaysia. Bermula dengan PPD Cameron Highlands dan sekolah-sekolah dalam daerah tersebut, dengan architecture yang ready untuk scale ke daerah-daerah lain.

**URL:** `mssd-ppdch.web.app/{tenant}/...`

---

## 2. Hierarki Pengguna & Tenant

### Struktur Tenant

```
Platform Owner (Developer)
└── Onboard & urus semua tenant

Tenant A: PPD Cameron Highlands        → mssd-ppdch.web.app/cameron-highlands
Tenant B: SMK Kg Raja                  → mssd-ppdch.web.app/smk-kg-raja
Tenant C: SMK Brinchang                → mssd-ppdch.web.app/smk-brinchang
...
```

### Roles dalam setiap Tenant

| Role | Siapa | Kebenaran |
|------|-------|-----------|
| `PLATFORM_OWNER` | Developer/anda | Urus semua tenant, onboard tenant baru |
| `SUPERADMIN` | PPD staff / Guru Sukan sekolah | Cipta & urus event, lantik admin & hakim |
| `ADMIN` | Guru Sukan sekolah (dalam tenant PPD) | Daftar atlet, semak keputusan sekolah sendiri |
| `HAKIM` | Hakim yang dilantik | Rekod keputusan acara yang di-assign sahaja |

### Tenant Types

| Type | Contoh | SuperAdmin cipta event untuk |
|------|--------|------------------------------|
| `PPD` | PPD Cameron Highlands | MSSD, acara peringkat daerah |
| `SEKOLAH` | SMK Kg Raja | Hari Sukan sekolah sendiri |

---

## 3. Flow Penuh Kejohanan

```
SETUP
  SuperAdmin login
  → Cipta Event (nama, tarikh, lokasi, peringkat)
  → Tambah Acara (100m L B16, Lompat Jauh P B14, dll)
  → Tetapkan had peserta per sekolah per acara
  → Invite / assign Admin sekolah-sekolah

PENDAFTARAN (status: OPEN)
  Admin sekolah login
  → Tambah atlet (nama, IC, tarikh lahir)
  → Kategori umur auto-calculate
  → Daftar atlet per acara (sistem check had)
  → SuperAdmin approve / reject pendaftaran

PRE-EVENT (status: CLOSED)
  SuperAdmin
  → Tutup pendaftaran
  → Jana heat automatik (shuffle atau seed by PB)
  → Assign Hakim per EventAcara
  → Cetak jadual & call sheet (PDF)

SEMASA KEJOHANAN (status: ONGOING)
  Hakim login
  → Nampak senarai acara yang di-assign
  → Pilih heat → rekod keputusan (masa/jarak/ketinggian)
  → Submit → sistem auto-rank dalam heat
  → Jana finalist untuk final

SELEPAS KEJOHANAN (status: COMPLETED)
  Sistem auto-calculate:
  → Ranking final tiap acara
  → Mata kumulatif per sekolah
  → Ranking sekolah keseluruhan

OUTPUT
  → Live leaderboard (public, no login)
  → PDF keputusan rasmi
  → PDF sijil (Emas/Perak/Gangsa) per atlet
  → Laporan ringkasan sekolah
```

---

## 4. Data Model (PostgreSQL)

### Layer 1: Tenant & Users

```sql
-- Tenant (organisasi)
tenants
  id              uuid PK
  slug            text UNIQUE  -- cameron-highlands, smk-kg-raja
  name            text
  type            enum(PPD, SEKOLAH)
  status          enum(ACTIVE, SUSPENDED)
  created_at      timestamp

-- Users
users
  id              uuid PK
  tenant_id       uuid FK → tenants
  email           text UNIQUE
  name            text
  role            enum(PLATFORM_OWNER, SUPERADMIN, ADMIN, HAKIM)
  status          enum(ACTIVE, INACTIVE)
  created_at      timestamp

-- Sekolah (dalam tenant PPD)
schools
  id              uuid PK
  tenant_id       uuid FK → tenants
  name            text        -- SMK Kg Raja, SMK Brinchang
  code            text        -- kod sekolah KPM
  admin_user_id   uuid FK → users
```

### Layer 2: Event & Acara

```sql
-- Kejohanan
events
  id              uuid PK
  tenant_id       uuid FK → tenants
  name            text        -- MSSD Olahraga CH 2026
  peringkat       enum(SEKOLAH, MSSD, MSSN, MSSM)
  location        text
  date_start      date
  date_end        date
  status          enum(DRAFT, OPEN, CLOSED, ONGOING, COMPLETED)
  created_by      uuid FK → users
  created_at      timestamp

-- Acara dalam kejohanan
event_acara
  id              uuid PK
  event_id        uuid FK → events
  nama_acara      text        -- 100m, Lompat Jauh, 4x100m
  jenis           enum(TREK, PADANG, REJANG)
  jantina         enum(L, P)
  kategori        enum(B12, B14, B16, B18, TERBUKA)
  unit            enum(MASA_MS, JARAK_CM, KETINGGIAN_CM)
  max_peserta_sekolah  int   -- had peserta per sekolah
  arah_terbaik    enum(RENDAH, TINGGI)  -- masa rendah = lebih baik, jarak tinggi = lebih baik
  bilangan_heat   int
  hakim_user_id   uuid FK → users
  status          enum(UPCOMING, ONGOING, COMPLETED)
```

### Layer 3: Atlet & Pendaftaran

```sql
-- Atlet
athletes
  id              uuid PK
  tenant_id       uuid FK → tenants
  school_id       uuid FK → schools
  name            text
  ic_number       text
  tarikh_lahir    date
  jantina         enum(L, P)
  kategori        text  -- auto-calculate: B12/B14/B16/B18

-- Pendaftaran atlet ke acara
registrations
  id              uuid PK
  event_acara_id  uuid FK → event_acara
  athlete_id      uuid FK → athletes
  school_id       uuid FK → schools
  status          enum(PENDING, APPROVED, REJECTED)
  note            text  -- sebab reject jika ada
  created_at      timestamp
```

### Layer 4: Heat & Keputusan

```sql
-- Heat / kumpulan
heats
  id              uuid PK
  event_acara_id  uuid FK → event_acara
  heat_number     int
  round           enum(HEAT, SEMIFINAL, FINAL)
  status          enum(UPCOMING, ONGOING, COMPLETED)

-- Peserta dalam heat
heat_lanes
  id              uuid PK
  heat_id         uuid FK → heats
  athlete_id      uuid FK → athletes
  lane_number     int   -- trek: lane 1-8, padang: giliran 1-N

-- Keputusan
results
  id              uuid PK
  heat_lane_id    uuid FK → heat_lanes
  value           bigint      -- masa dalam ms / jarak dalam mm
  wind_reading    decimal     -- bacaan angin (acara sprint/lompat)
  status          enum(COMPLETED, DNF, DNS, DQ)
  submitted_by    uuid FK → users  -- hakim
  submitted_at    timestamp
  updated_at      timestamp

-- Ranking final (auto-calculate)
rankings
  id              uuid PK
  event_acara_id  uuid FK → event_acara
  athlete_id      uuid FK → athletes
  school_id       uuid FK → schools
  kedudukan       int         -- 1, 2, 3...
  nilai_terbaik   bigint      -- nilai terbaik dari semua round
  mata            int         -- 8,7,6,5,4,3,2,1
  sijil           enum(EMAS, PERAK, GANGSA, HADIR)
```

### Layer 5: Markah Sekolah

```sql
-- Markah kumulatif sekolah per event (auto-aggregate)
school_standings
  id              uuid PK
  event_id        uuid FK → events
  school_id       uuid FK → schools
  total_mata      int
  emas            int
  perak           int
  gangsa          int
  ranking         int         -- auto-calculate
```

---

## 5. Sistem Mata (Standard MSSD Malaysia)

| Kedudukan | Mata | Sijil |
|-----------|------|-------|
| 1 | 8 | Emas |
| 2 | 7 | Perak |
| 3 | 6 | Gangsa |
| 4 | 5 | Hadir |
| 5 | 4 | Hadir |
| 6 | 3 | Hadir |
| 7 | 2 | Hadir |
| 8 | 1 | Hadir |

---

## 6. Kategori Umur (Auto-Calculate)

Berdasarkan tahun kejohanan tolak tahun lahir:

| Umur | Kategori |
|------|----------|
| 12 tahun ke bawah | Bawah 12 (B12) |
| 13-14 tahun | Bawah 14 (B14) |
| 15-16 tahun | Bawah 16 (B16) |
| 17-18 tahun | Bawah 18 (B18) |

---

## 7. Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + Server Actions |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (leaderboard) |
| Storage | Supabase Storage (PDF, sijil) |
| PDF | react-pdf / puppeteer |
| Hosting | Vercel |
| Routing | Path-based multi-tenant (`/[tenant]/...`) |

---

## 8. Halaman Utama (Pages)

### Public (no login)
- `/[tenant]` — landing page tenant
- `/[tenant]/events/[eventId]/leaderboard` — live leaderboard

### Auth
- `/[tenant]/login`
- `/[tenant]/setup` — first-time tenant setup

### SuperAdmin
- `/[tenant]/dashboard`
- `/[tenant]/events` — senarai event
- `/[tenant]/events/create`
- `/[tenant]/events/[eventId]` — manage event
- `/[tenant]/events/[eventId]/acara` — urus acara
- `/[tenant]/events/[eventId]/pendaftaran` — semak & approve pendaftaran
- `/[tenant]/events/[eventId]/heats` — jana & urus heat
- `/[tenant]/events/[eventId]/hakim` — assign hakim
- `/[tenant]/events/[eventId]/keputusan` — semak semua keputusan
- `/[tenant]/events/[eventId]/laporan` — jana laporan & sijil
- `/[tenant]/schools` — urus sekolah (tenant PPD)
- `/[tenant]/users` — urus pengguna

### Admin (Sekolah)
- `/[tenant]/dashboard`
- `/[tenant]/events/[eventId]/daftar` — daftar atlet
- `/[tenant]/athletes` — urus atlet sekolah
- `/[tenant]/events/[eventId]/keputusan` — keputusan sekolah sendiri

### Hakim
- `/[tenant]/hakim` — senarai acara assigned
- `/[tenant]/hakim/[eventAcaraId]` — rekod keputusan

### Platform Owner
- `/admin/tenants` — urus semua tenant
- `/admin/tenants/create` — onboard tenant baru

---

## 9. Security & Multi-Tenant Isolation

- Setiap request validate `tenant_id` dari slug URL
- Supabase Row Level Security (RLS) enforce tenant isolation di database level
- Role check di middleware Next.js sebelum render page
- Hakim hanya boleh access `event_acara` yang di-assign kepada mereka

---

## 10. Fasa Pembangunan

| Fasa | Skop | Anggaran |
|------|------|----------|
| 1 — Foundation | Setup, auth, tenant routing, DB schema | 1-2 minggu |
| 2 — Event & Pendaftaran | Cipta event, acara, daftar atlet | 2-3 minggu |
| 3 — Heat & Keputusan | Jana heat, hakim UI, rekod keputusan | 2-3 minggu |
| 4 — Output | Live leaderboard, PDF laporan, sijil | 1-2 minggu |
| 5 — Polish | UX, mobile responsive, bug fixes | 1 minggu |
