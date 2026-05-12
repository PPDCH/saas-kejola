import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import DaftarForm from './daftar-form'

export default async function DaftarPage({
  params,
}: {
  params: Promise<{ tenant: string; eventId: string }>
}) {
  const { tenant: slug, eventId } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()
  if (!event) notFound()

  // Atlet sekolah semasa
  let schoolId: string | null = null
  if (user?.role === 'ADMIN') {
    const { data: school } = await supabase
      .from('schools')
      .select('id, name')
      .eq('admin_user_id', user.id)
      .single()
    schoolId = school?.id ?? null
  }

  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq(schoolId ? 'school_id' : 'tenant_id', schoolId ?? tenant.id)
    .order('name')

  const { data: acaraList } = await supabase
    .from('event_acara')
    .select('*')
    .eq('event_id', eventId)
    .order('nama_acara')

  // Pendaftaran sedia ada untuk sekolah ini
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, athletes(name), event_acara(nama_acara, kategori, jantina)')
    .eq('school_id', schoolId ?? '')
    .in('event_acara_id', acaraList?.map((a) => a.id) ?? [])

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/${slug}/events/${eventId}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik ke Kejohanan
        </Link>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pendaftaran Atlet</h1>
          <p className="text-muted-foreground text-sm">{event.name}</p>
        </div>
        <Badge>{event.status === 'OPEN' ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}</Badge>
      </div>

      {event.status !== 'OPEN' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Pendaftaran tidak dibuka. Status kejohanan perlu &quot;OPEN&quot; untuk mendaftar atlet.
        </div>
      ) : (
        <DaftarForm
          tenant={slug}
          eventId={eventId}
          athletes={athletes ?? []}
          acaraList={acaraList ?? []}
          registrations={registrations ?? []}
        />
      )}
    </div>
  )
}
