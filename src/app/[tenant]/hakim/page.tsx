import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function HakimLandingPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  if (!['HAKIM', 'SUPERADMIN', 'PLATFORM_OWNER'].includes(user?.role)) notFound()

  const supabase = await createClient()

  // Hakim hanya nampak acara yang di-assign kepadanya, SuperAdmin nampak semua
  let query = supabase
    .from('event_acara')
    .select('*, events(name, date_start, status)')
    .order('created_at', { ascending: false })

  if (user?.role === 'HAKIM') {
    query = query.eq('hakim_user_id', user.id)
  } else {
    // SuperAdmin - tapis acara dalam event yang ONGOING
    query = query.not('events', 'is', null)
  }

  const { data: acaraList } = await query

  const activeAcara = acaraList?.filter((a) => (a.events as any)?.status === 'ONGOING') ?? []
  const otherAcara = acaraList?.filter((a) => (a.events as any)?.status !== 'ONGOING') ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Rekod Keputusan</h1>
      <p className="text-muted-foreground text-sm mb-6">Pilih acara untuk rekod keputusan</p>

      {activeAcara.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3 text-green-700">Sedang Berlangsung</h2>
          <div className="space-y-2">
            {activeAcara.map((acara) => (
              <Link key={acara.id} href={`/${slug}/hakim/${acara.id}`}>
                <div className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{acara.nama_acara}</p>
                      <p className="text-sm text-muted-foreground">
                        {(acara.events as any)?.name} · {acara.kategori} · {acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
                      </p>
                    </div>
                    <Badge>{acara.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {otherAcara.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-muted-foreground">Lain-lain</h2>
          <div className="space-y-2">
            {otherAcara.map((acara) => (
              <Link key={acara.id} href={`/${slug}/hakim/${acara.id}`}>
                <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{acara.nama_acara}</p>
                      <p className="text-sm text-muted-foreground">
                        {(acara.events as any)?.name} · {acara.kategori} · {acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
                      </p>
                    </div>
                    <Badge variant="outline">{acara.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!acaraList?.length && (
        <p className="text-muted-foreground text-center py-12 bg-white rounded-lg border">
          Tiada acara yang di-assign kepada anda.
        </p>
      )}
    </div>
  )
}
