import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import HeatControls from './heat-controls'

export default async function HeatsPage({
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

  const { data: acaraList } = await supabase
    .from('event_acara')
    .select('*, heats(id, heat_number, status, heat_lanes(id, lane_number, athletes(name, ic_number)))')
    .eq('event_id', eventId)
    .order('nama_acara')

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/${slug}/events/${eventId}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik ke Kejohanan
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">Urus Heat</h1>
      <p className="text-muted-foreground text-sm mb-6">{event?.name}</p>

      <div className="space-y-6">
        {acaraList?.map((acara) => (
          <div key={acara.id} className="bg-white rounded-lg border p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold">{acara.nama_acara}</h2>
                <p className="text-sm text-muted-foreground">
                  {acara.kategori} · {acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'} · {acara.bilangan_heat} heat
                </p>
              </div>
              <HeatControls acaraId={acara.id} tenant={slug} eventId={eventId} hasHeats={(acara.heats as any[])?.length > 0} />
            </div>

            {(acara.heats as any[])?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(acara.heats as any[]).sort((a, b) => a.heat_number - b.heat_number).map((heat: any) => (
                  <div key={heat.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Heat {heat.heat_number}</span>
                      <Badge variant="outline">{heat.status}</Badge>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left pb-1">Lane</th>
                          <th className="text-left pb-1">Atlet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(heat.heat_lanes as any[]).sort((a: any, b: any) => a.lane_number - b.lane_number).map((lane: any) => (
                          <tr key={lane.id}>
                            <td className="py-0.5 pr-3 font-mono">{lane.lane_number}</td>
                            <td className="py-0.5">{lane.athletes?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Heat belum dijana.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
