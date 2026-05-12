import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  const supabase = await createClient()
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  const { count: schoolsCount } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  const { count: athletesCount } = await supabase
    .from('athletes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Selamat datang, {user?.name}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Kejohanan</p>
          <p className="text-3xl font-bold mt-1">{eventsCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Sekolah</p>
          <p className="text-3xl font-bold mt-1">{schoolsCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Atlet Berdaftar</p>
          <p className="text-3xl font-bold mt-1">{athletesCount ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
