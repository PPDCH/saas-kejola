import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { count: tenantsCount } = await supabase
    .from('tenants').select('*', { count: 'exact', head: true })
  const { count: usersCount } = await supabase
    .from('users').select('*', { count: 'exact', head: true })
  const { count: eventsCount } = await supabase
    .from('events').select('*', { count: 'exact', head: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Platform Dashboard</h1>
      <p className="text-muted-foreground mb-8">Ringkasan keseluruhan platform Kejola</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Jumlah Tenant</p>
          <p className="text-3xl font-bold mt-1">{tenantsCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Jumlah Pengguna</p>
          <p className="text-3xl font-bold mt-1">{usersCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Jumlah Kejohanan</p>
          <p className="text-3xl font-bold mt-1">{eventsCount ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
