import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function AthletesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  const supabase = await createClient()

  let query = supabase
    .from('athletes')
    .select('*, schools(name)')
    .eq('tenant_id', tenant.id)
    .order('name')

  // ADMIN hanya nampak atlet sekolah sendiri
  if (user?.role === 'ADMIN') {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('admin_user_id', user.id)
      .single()
    if (school) query = query.eq('school_id', school.id)
  }

  const { data: athletes } = await query

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Atlet</h1>
        <Link href={`/${slug}/athletes/create`}>
          <Button>+ Daftar Atlet</Button>
        </Link>
      </div>

      {athletes?.length ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">Nama</th>
                <th className="text-left p-3 font-medium">No. IC</th>
                <th className="text-left p-3 font-medium">Tarikh Lahir</th>
                <th className="text-left p-3 font-medium">Jantina</th>
                <th className="text-left p-3 font-medium">Kategori</th>
                <th className="text-left p-3 font-medium">Sekolah</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete) => (
                <tr key={athlete.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{athlete.name}</td>
                  <td className="p-3 font-mono text-xs">{athlete.ic_number}</td>
                  <td className="p-3">{athlete.tarikh_lahir}</td>
                  <td className="p-3">{athlete.jantina === 'L' ? 'Lelaki' : 'Perempuan'}</td>
                  <td className="p-3"><Badge variant="outline">{athlete.kategori}</Badge></td>
                  <td className="p-3 text-muted-foreground">{(athlete.schools as any)?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12 bg-white rounded-lg border">
          Tiada atlet lagi.
        </p>
      )}
    </div>
  )
}
