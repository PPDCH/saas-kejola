import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import ApproveButtons from './approve-buttons'

export default async function PendaftaranAdminPage({
  params,
}: {
  params: Promise<{ tenant: string; eventId: string }>
}) {
  const { tenant: slug, eventId } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  if (!['SUPERADMIN', 'PLATFORM_OWNER'].includes(user?.role)) notFound()

  const supabase = await createClient()

  const { data: event } = await supabase.from('events').select('name').eq('id', eventId).single()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, athletes(name, ic_number), event_acara(nama_acara, kategori, jantina), schools(name)')
    .in('event_acara_id', (
      await supabase.from('event_acara').select('id').eq('event_id', eventId)
    ).data?.map((a) => a.id) ?? [])
    .order('status')

  const pending = registrations?.filter((r) => r.status === 'PENDING') ?? []
  const approved = registrations?.filter((r) => r.status === 'APPROVED') ?? []

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/${slug}/events/${eventId}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik ke Kejohanan
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">Urus Pendaftaran</h1>
      <p className="text-muted-foreground text-sm mb-6">{event?.name}</p>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3 text-yellow-700">Menunggu Kelulusan ({pending.length})</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-yellow-50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">Atlet</th>
                  <th className="text-left p-3 font-medium">Sekolah</th>
                  <th className="text-left p-3 font-medium">Acara</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((reg) => (
                  <tr key={reg.id} className="border-t">
                    <td className="p-3">{reg.athletes?.name}</td>
                    <td className="p-3 text-muted-foreground">{reg.schools?.name}</td>
                    <td className="p-3">{reg.event_acara?.nama_acara}</td>
                    <td className="p-3 text-right">
                      <ApproveButtons regId={reg.id} tenant={slug} eventId={eventId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3 text-green-700">Diluluskan ({approved.length})</h2>
        {approved.length ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">Atlet</th>
                  <th className="text-left p-3 font-medium">Sekolah</th>
                  <th className="text-left p-3 font-medium">Acara</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((reg) => (
                  <tr key={reg.id} className="border-t">
                    <td className="p-3">{reg.athletes?.name}</td>
                    <td className="p-3 text-muted-foreground">{reg.schools?.name}</td>
                    <td className="p-3">{reg.event_acara?.nama_acara}</td>
                    <td className="p-3"><Badge>Diluluskan</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Tiada pendaftaran diluluskan lagi.</p>
        )}
      </div>
    </div>
  )
}
