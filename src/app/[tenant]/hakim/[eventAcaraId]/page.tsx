import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ResultForm from './result-form'

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '-'
  if (unit === 'MASA_MS') {
    const ms = value
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
    return `${seconds}.${String(centiseconds).padStart(2, '0')}`
  }
  if (unit === 'JARAK_MM' || unit === 'KETINGGIAN_MM') {
    return `${(value / 1000).toFixed(2)}m`
  }
  return String(value)
}

export default async function HakimAcaraPage({
  params,
}: {
  params: Promise<{ tenant: string; eventAcaraId: string }>
}) {
  const { tenant: slug, eventAcaraId } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  if (!['HAKIM', 'SUPERADMIN', 'PLATFORM_OWNER'].includes(user?.role)) notFound()

  const supabase = await createClient()

  const { data: acara } = await supabase
    .from('event_acara')
    .select('*, events(name)')
    .eq('id', eventAcaraId)
    .single()

  if (!acara) notFound()

  const { data: heats } = await supabase
    .from('heats')
    .select('*, heat_lanes(id, lane_number, athletes(name, ic_number), results(id, value, status, wind_reading))')
    .eq('event_acara_id', eventAcaraId)
    .order('heat_number')

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/${slug}/hakim`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Senarai Acara
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{acara.nama_acara}</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {(acara.events as any)?.name} · {acara.kategori} · {acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
      </p>

      {!heats?.length ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Heat belum dijana untuk acara ini.
        </div>
      ) : (
        <div className="space-y-6">
          {heats.map((heat) => (
            <div key={heat.id} className="bg-white rounded-lg border p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Heat {heat.heat_number}</h2>
                <Badge variant="outline">{heat.status}</Badge>
              </div>
              <div className="space-y-3">
                {(heat.heat_lanes as any[])
                  .sort((a, b) => a.lane_number - b.lane_number)
                  .map((lane: any) => {
                    const result = lane.results?.[0]
                    return (
                      <div key={lane.id} className="flex items-center gap-4 p-3 rounded-md bg-gray-50">
                        <span className="w-8 text-center font-mono text-sm text-muted-foreground">
                          {lane.lane_number}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{lane.athletes?.name}</p>
                          <p className="text-xs text-muted-foreground">{lane.athletes?.ic_number}</p>
                        </div>
                        <div className="text-right mr-4">
                          {result ? (
                            <div>
                              <p className="font-mono font-semibold text-sm">
                                {result.status === 'COMPLETED'
                                  ? formatValue(result.value, acara.unit)
                                  : result.status}
                              </p>
                              {result.wind_reading && (
                                <p className="text-xs text-muted-foreground">angin: {result.wind_reading}m/s</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum</span>
                          )}
                        </div>
                        <ResultForm
                          heatLaneId={lane.id}
                          unit={acara.unit}
                          existing={result}
                          tenant={slug}
                          eventAcaraId={eventAcaraId}
                        />
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
