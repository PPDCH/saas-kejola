import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateEventStatus } from '../actions'

const jeinsLabel: Record<string, string> = { TREK: 'Trek', PADANG: 'Padang', REJANG: 'Rejang' }
const unitLabel: Record<string, string> = { MASA_MS: 'Masa', JARAK_MM: 'Jarak', KETINGGIAN_MM: 'Ketinggian' }

const STATUS_FLOW = ['DRAFT', 'OPEN', 'CLOSED', 'ONGOING', 'COMPLETED']
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf', OPEN: 'Buka Pendaftaran', CLOSED: 'Tutup Pendaftaran',
  ONGOING: 'Sedang Berlangsung', COMPLETED: 'Selesai',
}

export default async function EventDetailPage({
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
    .eq('tenant_id', tenant.id)
    .single()

  if (!event) notFound()

  const { data: acaraList } = await supabase
    .from('event_acara')
    .select('*')
    .eq('event_id', eventId)
    .order('jenis')
    .order('kategori')
    .order('jantina')

  const isAdmin = ['SUPERADMIN', 'PLATFORM_OWNER'].includes(user?.role)
  const currentStatusIdx = STATUS_FLOW.indexOf(event.status)
  const nextStatus = STATUS_FLOW[currentStatusIdx + 1]

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/${slug}/events`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Kejohanan
        </Link>
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {event.peringkat} • {event.location} • {event.date_start} — {event.date_end}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{STATUS_LABEL[event.status] ?? event.status}</Badge>
          {isAdmin && nextStatus && (
            <form action={async () => {
              'use server'
              await updateEventStatus(eventId, nextStatus, slug)
            }}>
              <Button type="submit" variant="outline" size="sm">
                → {STATUS_LABEL[nextStatus]}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Senarai Acara ({acaraList?.length ?? 0})</h2>
        {isAdmin && (
          <Link href={`/${slug}/events/${eventId}/acara`}>
            <Button size="sm">+ Tambah Acara</Button>
          </Link>
        )}
      </div>

      {acaraList?.length ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">Nama Acara</th>
                <th className="text-left p-3 font-medium">Jenis</th>
                <th className="text-left p-3 font-medium">Kategori</th>
                <th className="text-left p-3 font-medium">Jantina</th>
                <th className="text-left p-3 font-medium">Unit</th>
                <th className="text-left p-3 font-medium">Max/Sekolah</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {acaraList.map((acara) => (
                <tr key={acara.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{acara.nama_acara}</td>
                  <td className="p-3">{jeinsLabel[acara.jenis]}</td>
                  <td className="p-3">{acara.kategori}</td>
                  <td className="p-3">{acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'}</td>
                  <td className="p-3">{unitLabel[acara.unit]}</td>
                  <td className="p-3">{acara.max_peserta_sekolah}</td>
                  <td className="p-3">
                    <Badge variant="outline">{acara.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12 bg-white rounded-lg border">
          Tiada acara lagi. Klik &quot;+ Tambah Acara&quot; untuk mula.
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {isAdmin && event.status === 'OPEN' && (
          <Link href={`/${slug}/events/${eventId}/pendaftaran`}>
            <Button variant="outline">Urus Pendaftaran</Button>
          </Link>
        )}
        {isAdmin && event.status === 'CLOSED' && (
          <Link href={`/${slug}/events/${eventId}/heats`}>
            <Button variant="outline">Jana Heat</Button>
          </Link>
        )}
        <Link href={`/${slug}/events/${eventId}/leaderboard`}>
          <Button variant="outline">Papan Markah</Button>
        </Link>
        {isAdmin && (
          <Link href={`/${slug}/events/${eventId}/laporan`}>
            <Button variant="outline">Laporan & PDF</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
