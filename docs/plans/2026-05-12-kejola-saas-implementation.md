# Kejola SaaS — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bina SaaS multi-tenant untuk pengurusan kejohanan olahraga sekolah Malaysia, bermula dengan PPD Cameron Highlands.

**Architecture:** Next.js App Router dengan path-based multi-tenant routing (`/[tenant]/...`), PostgreSQL via Supabase untuk data relational, Supabase Realtime untuk live leaderboard.

**Tech Stack:** Next.js 14, Supabase (PostgreSQL + Auth + Realtime + Storage), Tailwind CSS, shadcn/ui, Vercel

**Design Doc:** `docs/plans/2026-05-12-kejola-saas-design.md`

---

## Fasa 1: Foundation

### Task 1: Setup Projek Next.js

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.ts`
- Create: `.env.local.example`

**Step 1: Init Next.js project**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Step 2: Install dependencies**
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init
```

**Step 3: Install shadcn components yang diperlukan**
```bash
npx shadcn@latest add button input label card table badge select dialog form toast
```

**Step 4: Verify dev server jalan**
```bash
npm run dev
```
Expected: `http://localhost:3000` buka tanpa error

**Step 5: Commit**
```bash
git init
git add .
git commit -m "feat: init Next.js project with Supabase and shadcn/ui"
```

---

### Task 2: Setup Supabase Project

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Modify: `.env.local`

**Step 1: Cipta Supabase project**
- Pergi ke supabase.com → New Project
- Simpan: Project URL, anon key, service_role key

**Step 2: Buat `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Step 3: Buat Supabase client untuk browser**
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4: Buat Supabase client untuk server**
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Step 5: Buat middleware untuk auth**
```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect ke login jika belum auth (kecuali halaman public)
  const publicPaths = ['/login', '/leaderboard']
  const isPublic = publicPaths.some(p => request.nextUrl.pathname.includes(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    // Extract tenant dari URL
    const segments = url.pathname.split('/')
    const tenant = segments[1]
    url.pathname = `/${tenant}/login`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Step 6: Commit**
```bash
git add .
git commit -m "feat: setup Supabase client, server, and auth middleware"
```

---

### Task 3: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Buat migration file**
```sql
-- supabase/migrations/001_initial_schema.sql

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
```

**Step 2: Apply migration ke Supabase**
- Pergi ke Supabase Dashboard → SQL Editor
- Paste dan run migration SQL

**Step 3: Verify tables wujud**
- Supabase Dashboard → Table Editor
- Semak semua 11 tables wujud

**Step 4: Commit migration file**
```bash
git add supabase/
git commit -m "feat: add initial database schema"
```

---

### Task 4: Multi-Tenant Routing Structure

**Files:**
- Create: `src/app/[tenant]/layout.tsx`
- Create: `src/app/[tenant]/page.tsx`
- Create: `src/lib/tenant.ts`
- Create: `src/app/admin/layout.tsx`

**Step 1: Buat tenant resolver**
```typescript
// src/lib/tenant.ts
import { createClient } from '@/lib/supabase/server'

export async function getTenant(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .single()

  if (error || !data) return null
  return data
}

export async function getCurrentUser(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  return data
}
```

**Step 2: Buat tenant layout**
```typescript
// src/app/[tenant]/layout.tsx
import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)

  if (!tenant) notFound()

  return <>{children}</>
}
```

**Step 3: Buat tenant home page (placeholder)**
```typescript
// src/app/[tenant]/page.tsx
import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'

export default async function TenantPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{tenant.name}</h1>
      <p className="text-muted-foreground">Sistem Pengurusan Kejohanan Olahraga</p>
    </main>
  )
}
```

**Step 4: Test routing**
- Masukkan tenant pertama ke database melalui Supabase Dashboard:
```sql
INSERT INTO tenants (slug, name, type) VALUES ('cameron-highlands', 'PPD Cameron Highlands', 'PPD');
```
- Buka `http://localhost:3000/cameron-highlands`
- Expected: Nampak nama tenant

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add multi-tenant routing with tenant resolver"
```

---

## Fasa 2: Auth & User Management

### Task 5: Login Page

**Files:**
- Create: `src/app/[tenant]/login/page.tsx`
- Create: `src/app/[tenant]/login/actions.ts`

**Step 1: Buat login page**
```typescript
// src/app/[tenant]/login/page.tsx
'use client'
import { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage({ params }: { params: { tenant: string } }) {
  const [error, setError] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Log Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            const result = await login(formData, params.tenant)
            if (result?.error) setError(result.error)
          }} className="space-y-4">
            <div>
              <Label htmlFor="email">Emel</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Kata Laluan</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Log Masuk</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Buat login server action**
```typescript
// src/app/[tenant]/login/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData, tenantSlug: string) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Emel atau kata laluan tidak sah.' }

  redirect(`/${tenantSlug}/dashboard`)
}

export async function logout(tenantSlug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${tenantSlug}/login`)
}
```

**Step 3: Test login**
- Cipta test user di Supabase Auth dashboard
- Cuba login di `http://localhost:3000/cameron-highlands/login`
- Expected: Redirect ke `/cameron-highlands/dashboard`

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add login page and auth actions"
```

---

### Task 6: Dashboard Layout & Navigation

**Files:**
- Create: `src/app/[tenant]/dashboard/layout.tsx`
- Create: `src/components/nav/sidebar.tsx`
- Create: `src/app/[tenant]/dashboard/page.tsx`

**Step 1: Buat sidebar navigation**
```typescript
// src/components/nav/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Trophy, Users, School, FileText, LogOut } from 'lucide-react'

const navItems = (tenant: string, role: string) => {
  const base = [
    { href: `/${tenant}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${tenant}/events`, label: 'Kejohanan', icon: Trophy },
  ]
  if (['SUPERADMIN', 'PLATFORM_OWNER'].includes(role)) {
    base.push(
      { href: `/${tenant}/schools`, label: 'Sekolah', icon: School },
      { href: `/${tenant}/users`, label: 'Pengguna', icon: Users },
    )
  }
  if (role === 'ADMIN') {
    base.push({ href: `/${tenant}/athletes`, label: 'Atlet', icon: Users })
  }
  return base
}

export function Sidebar({ tenant, role }: { tenant: string; role: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="font-bold text-lg">Kejola</h1>
        <p className="text-slate-400 text-sm mt-1">{tenant}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems(tenant, role).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

**Step 2: Buat dashboard layout**
```typescript
// src/app/[tenant]/dashboard/layout.tsx
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound, redirect } from 'next/navigation'
import { Sidebar } from '@/components/nav/sidebar'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()

  const user = await getCurrentUser(tenant.id)
  if (!user) redirect(`/${slug}/login`)

  return (
    <div className="flex min-h-screen">
      <Sidebar tenant={slug} role={user.role} />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  )
}
```

**Step 3: Buat dashboard home page**
```typescript
// src/app/[tenant]/dashboard/page.tsx
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Selamat datang, {user?.name}</p>
    </div>
  )
}
```

**Step 4: Test dashboard**
- Login → Expected: Nampak sidebar + dashboard
- Verify nav links betul ikut role

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add dashboard layout with role-based sidebar navigation"
```

---

## Fasa 3: Event Management

### Task 7: Senarai & Cipta Event

**Files:**
- Create: `src/app/[tenant]/events/page.tsx`
- Create: `src/app/[tenant]/events/create/page.tsx`
- Create: `src/app/[tenant]/events/actions.ts`

**Step 1: Buat events list page**
```typescript
// src/app/[tenant]/events/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const statusColor: Record<string, string> = {
  DRAFT: 'secondary', OPEN: 'default', CLOSED: 'outline',
  ONGOING: 'default', COMPLETED: 'secondary'
}

export default async function EventsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('date_start', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kejohanan</h1>
        {['SUPERADMIN', 'PLATFORM_OWNER'].includes(user?.role) && (
          <Link href={`/${slug}/events/create`}>
            <Button>+ Cipta Kejohanan</Button>
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {events?.map((event) => (
          <Link key={event.id} href={`/${slug}/events/${event.id}`}>
            <div className="bg-white p-4 rounded-lg border hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{event.name}</h2>
                  <p className="text-sm text-muted-foreground">{event.location} • {event.date_start}</p>
                </div>
                <Badge variant={statusColor[event.status] as any}>{event.status}</Badge>
              </div>
            </div>
          </Link>
        ))}
        {!events?.length && (
          <p className="text-muted-foreground text-center py-12">Tiada kejohanan lagi.</p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Buat create event form**
```typescript
// src/app/[tenant]/events/create/page.tsx
'use client'
import { useState } from 'react'
import { createEvent } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateEventPage({ params }: { params: { tenant: string } }) {
  const [peringkat, setPeringkat] = useState('MSSD')

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Cipta Kejohanan</h1>
      <form action={(fd) => createEvent(fd, params.tenant)} className="space-y-4">
        <div>
          <Label>Nama Kejohanan</Label>
          <Input name="name" placeholder="MSSD Olahraga Cameron Highlands 2026" required />
        </div>
        <div>
          <Label>Peringkat</Label>
          <Select name="peringkat" value={peringkat} onValueChange={setPeringkat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SEKOLAH">Sekolah</SelectItem>
              <SelectItem value="MSSD">MSSD</SelectItem>
              <SelectItem value="MSSN">MSSN</SelectItem>
              <SelectItem value="MSSM">MSSM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lokasi</Label>
          <Input name="location" placeholder="Stadium Cameron Highlands" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tarikh Mula</Label>
            <Input name="date_start" type="date" required />
          </div>
          <div>
            <Label>Tarikh Tamat</Label>
            <Input name="date_end" type="date" required />
          </div>
        </div>
        <Button type="submit" className="w-full">Cipta Kejohanan</Button>
      </form>
    </div>
  )
}
```

**Step 3: Buat server action untuk create event**
```typescript
// src/app/[tenant]/events/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData, tenantSlug: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) return

  const { data, error } = await supabase.from('events').insert({
    tenant_id: tenant.id,
    name: formData.get('name'),
    peringkat: formData.get('peringkat'),
    location: formData.get('location'),
    date_start: formData.get('date_start'),
    date_end: formData.get('date_end'),
    created_by: user.id,
  }).select().single()

  if (error || !data) return
  redirect(`/${tenantSlug}/events/${data.id}`)
}
```

**Step 4: Test cipta event**
- Login sebagai SUPERADMIN
- Pergi `/cameron-highlands/events/create`
- Isi form → submit
- Expected: Redirect ke event page baru

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add event list and create event pages"
```

---

### Task 8: Manage Acara dalam Event

**Files:**
- Create: `src/app/[tenant]/events/[eventId]/page.tsx`
- Create: `src/app/[tenant]/events/[eventId]/acara/page.tsx`
- Create: `src/app/[tenant]/events/[eventId]/acara/actions.ts`

*(Ikut pattern yang sama: list → form → server action → commit)*

Acara standard Malaysia untuk dijadikan template:
```typescript
const ACARA_STANDARD = [
  // Trek
  { nama: '100m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '200m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '400m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '800m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '1500m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '3000m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '5000m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '110m Berpagar', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '400m Berpagar', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '4x100m Rejang', jenis: 'REJANG', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '4x400m Rejang', jenis: 'REJANG', unit: 'MASA_MS', arah: 'RENDAH' },
  // Padang
  { nama: 'Lompat Jauh', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lompat Tinggi', jenis: 'PADANG', unit: 'KETINGGIAN_MM', arah: 'TINGGI' },
  { nama: 'Lompat Kijang', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lontar Peluru', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lempar Cakera', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lempar Lembing', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
]
```

**Commit:**
```bash
git commit -m "feat: add acara management with standard Malaysia athletics templates"
```

---

## Fasa 4: Pendaftaran Atlet

### Task 9: Manage Atlet (Admin Sekolah)

**Files:**
- Create: `src/app/[tenant]/athletes/page.tsx`
- Create: `src/app/[tenant]/athletes/create/page.tsx`
- Create: `src/lib/kategori.ts`

**Step 1: Buat kategori calculator**
```typescript
// src/lib/kategori.ts
export function calculateKategori(tarikhLahir: string, tarikhKejohanan: string): string {
  const lahir = new Date(tarikhLahir).getFullYear()
  const kejohanan = new Date(tarikhKejohanan).getFullYear()
  const umur = kejohanan - lahir

  if (umur <= 12) return 'B12'
  if (umur <= 14) return 'B14'
  if (umur <= 16) return 'B16'
  if (umur <= 18) return 'B18'
  return 'TERBUKA'
}
```

**Commit:**
```bash
git commit -m "feat: add athlete management with auto kategori calculation"
```

---

### Task 10: Pendaftaran Atlet ke Acara

**Files:**
- Create: `src/app/[tenant]/events/[eventId]/daftar/page.tsx`
- Create: `src/app/[tenant]/events/[eventId]/daftar/actions.ts`
- Create: `src/app/[tenant]/events/[eventId]/pendaftaran/page.tsx` (SuperAdmin)

Validation yang perlu:
- Atlet hanya boleh daftar acara yang sesuai dengan kategori & jantina
- Semak had `max_peserta_sekolah` per acara
- Status event mesti `OPEN`

**Commit:**
```bash
git commit -m "feat: add athlete registration with validation"
```

---

## Fasa 5: Heat & Keputusan

### Task 11: Jana Heat Automatik

**Files:**
- Create: `src/app/[tenant]/events/[eventId]/heats/page.tsx`
- Create: `src/app/[tenant]/events/[eventId]/heats/actions.ts`

**Logik jana heat:**
```typescript
// Shuffle peserta yang approved → bahagi kepada bilangan heat
async function generateHeats(eventAcaraId: string) {
  // 1. Ambil semua pendaftaran APPROVED
  // 2. Shuffle secara rawak
  // 3. Bahagi kepada bilangan heat (contoh: 10 peserta, 2 heat = 5 each)
  // 4. Assign lane number
  // 5. Insert ke heats + heat_lanes
}
```

**Commit:**
```bash
git commit -m "feat: add automatic heat generation with random shuffle"
```

---

### Task 12: Hakim Interface — Rekod Keputusan

**Files:**
- Create: `src/app/[tenant]/hakim/page.tsx`
- Create: `src/app/[tenant]/hakim/[eventAcaraId]/page.tsx`
- Create: `src/app/[tenant]/hakim/[eventAcaraId]/actions.ts`

**Step 1: Hakim landing — nampak acara assigned sahaja**
```typescript
// Query: event_acara WHERE hakim_user_id = current_user.id
```

**Step 2: Form rekod keputusan**
- Senarai peserta dalam heat
- Input masa (mm:ss.ms) atau jarak (m.cm) bergantung pada unit
- Dropdown status: COMPLETED / DNF / DNS / DQ
- Submit → auto-convert ke ms atau mm

**Step 3: Convert input ke unit standard**
```typescript
// Masa: "12.34" → 12340 ms
// Jarak: "7.25" → 7250 mm
function convertToStandardUnit(value: string, unit: string): number {
  if (unit === 'MASA_MS') return Math.round(parseFloat(value) * 1000)
  if (unit === 'JARAK_MM') return Math.round(parseFloat(value) * 1000)
  return 0
}
```

**Commit:**
```bash
git commit -m "feat: add hakim interface for recording event results"
```

---

### Task 13: Auto-Calculate Ranking

**Files:**
- Create: `src/lib/ranking.ts`

```typescript
// Dipanggil setiap kali result disubmit / event completed
async function calculateRankings(eventAcaraId: string) {
  // 1. Ambil semua results untuk acara ini
  // 2. Sort by value (RENDAH: ascending, TINGGI: descending)
  // 3. Assign kedudukan 1,2,3...
  // 4. Assign mata (8,7,6,5,4,3,2,1)
  // 5. Assign sijil (1=EMAS, 2=PERAK, 3=GANGSA, lain=HADIR)
  // 6. Upsert ke rankings table
  // 7. Recalculate school_standings
}
```

**Commit:**
```bash
git commit -m "feat: add auto-ranking calculation and school standings"
```

---

## Fasa 6: Output & Laporan

### Task 14: Live Leaderboard (Public)

**Files:**
- Create: `src/app/[tenant]/events/[eventId]/leaderboard/page.tsx`

- Page ini **tidak perlukan login**
- Guna Supabase Realtime untuk auto-refresh
- Tunjuk: ranking sekolah + keputusan terkini tiap acara

**Commit:**
```bash
git commit -m "feat: add public live leaderboard with realtime updates"
```

---

### Task 15: PDF Laporan & Sijil

**Files:**
- Create: `src/app/[tenant]/events/[eventId]/laporan/page.tsx`
- Create: `src/app/api/pdf/keputusan/route.ts`
- Create: `src/app/api/pdf/sijil/route.ts`

Install:
```bash
npm install @react-pdf/renderer
```

Output:
1. **Keputusan rasmi** — semua acara, ranking final
2. **Sijil individu** — nama atlet, acara, kedudukan, nama event
3. **Laporan sekolah** — ringkasan pingat & mata

**Commit:**
```bash
git commit -m "feat: add PDF generation for results, certificates, and school reports"
```

---

## Fasa 7: Platform Owner

### Task 16: Admin Panel — Urus Tenant

**Files:**
- Create: `src/app/admin/tenants/page.tsx`
- Create: `src/app/admin/tenants/create/page.tsx`

Route `/admin/*` hanya untuk role `PLATFORM_OWNER`.

**Commit:**
```bash
git commit -m "feat: add platform owner admin panel for tenant management"
```

---

## Checklist Deploy

- [ ] Setup Supabase production project
- [ ] Configure Row Level Security (RLS) policies
- [ ] Setup Vercel project, connect GitHub repo
- [ ] Set environment variables di Vercel
- [ ] Push ke main → auto-deploy
- [ ] Test dengan tenant cameron-highlands
- [ ] Onboard user PPD (cipta auth user + users table row)

---

## Urutan Prioriti

```
Task 1-4   → Foundation (wajib selesai dulu)
Task 5-6   → Auth & Dashboard
Task 7-8   → Event & Acara
Task 9-10  → Atlet & Pendaftaran
Task 11-12 → Heat & Keputusan
Task 13    → Ranking (kunci sistem)
Task 14    → Live Leaderboard
Task 15    → PDF Output
Task 16    → Admin Panel (boleh last)
```
