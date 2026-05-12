import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LaporanPage({
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
  const { data: event } = await supabase
    .from('events')
    .select('name, status')
    .eq('id', eventId)
    .single()
  if (!event) notFound()

  const keputusanUrl = `/api/pdf/keputusan?eventId=${eventId}&tenantId=${tenant.id}`
  const sekolahUrl = `/api/pdf/sekolah?eventId=${eventId}&tenantId=${tenant.id}`

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/${slug}/events/${eventId}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik ke Kejohanan
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">Laporan & Cetakan</h1>
      <p className="text-muted-foreground text-sm mb-6">{event.name}</p>

      <div className="space-y-3">
        <a href={keputusanUrl} target="_blank" rel="noreferrer">
          <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Keputusan Rasmi</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Semua acara, ranking final, nilai terbaik atlet
                </p>
              </div>
              <Button variant="outline" size="sm">Muat Turun PDF</Button>
            </div>
          </div>
        </a>

        <a href={sekolahUrl} target="_blank" rel="noreferrer">
          <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Laporan Kedudukan Sekolah</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ringkasan pingat emas/perak/gangsa dan jumlah mata per sekolah
                </p>
              </div>
              <Button variant="outline" size="sm">Muat Turun PDF</Button>
            </div>
          </div>
        </a>
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Nota: Sijil peserta perlu dicetak secara manual.
      </p>
    </div>
  )
}
