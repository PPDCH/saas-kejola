'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '-'
  if (unit === 'MASA_MS') {
    const minutes = Math.floor(value / 60000)
    const seconds = Math.floor((value % 60000) / 1000)
    const cs = Math.floor((value % 1000) / 10)
    if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
    return `${seconds}.${String(cs).padStart(2, '0')}`
  }
  return `${(value / 1000).toFixed(2)}m`
}

const sijilColor: Record<string, string> = {
  EMAS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PERAK: 'bg-gray-100 text-gray-700 border-gray-300',
  GANGSA: 'bg-orange-100 text-orange-700 border-orange-300',
  HADIR: 'bg-white text-gray-500 border-gray-200',
}

export default function LeaderboardClient({
  event,
  tenant,
  standings: initialStandings,
  acaraList,
  rankingsByAcara: initialRankings,
}: {
  event: any
  tenant: string
  standings: any[]
  acaraList: any[]
  rankingsByAcara: Record<string, any[]>
}) {
  const [standings, setStandings] = useState(initialStandings)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Supabase Realtime — subscribe kepada perubahan rankings & school_standings
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_standings' }, () => {
        setLastUpdate(new Date())
        // Reload standings
        supabase
          .from('school_standings')
          .select('*, schools(name, code)')
          .eq('event_id', event.id)
          .order('ranking', { nullsFirst: false })
          .then(({ data }) => { if (data) setStandings(data) })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [event.id])

  const [activeTab, setActiveTab] = useState<'standings' | 'keputusan'>('standings')

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{event.name}</h1>
            <p className="text-slate-400 text-sm">{event.peringkat} · {event.location}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              LIVE
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Kemaskini: {lastUpdate.toLocaleTimeString('ms-MY')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['standings', 'keputusan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'standings' ? 'Kedudukan Sekolah' : 'Keputusan Acara'}
            </button>
          ))}
        </div>

        {activeTab === 'standings' && (
          <div>
            <h2 className="font-semibold mb-4 text-slate-300">Kedudukan Keseluruhan</h2>
            {standings.length ? (
              <div className="space-y-2">
                {standings.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`rounded-lg p-4 flex items-center gap-4 ${
                      idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : idx === 1 ? 'bg-gray-400/10 border border-gray-400/20'
                        : idx === 2 ? 'bg-orange-400/10 border border-orange-400/20'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    <span className={`text-2xl font-bold w-8 text-center ${
                      idx === 0 ? 'text-yellow-400'
                        : idx === 1 ? 'text-gray-300'
                        : idx === 2 ? 'text-orange-400'
                        : 'text-slate-500'
                    }`}>
                      {s.ranking ?? idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{s.schools?.name}</p>
                    </div>
                    <div className="flex gap-4 text-center text-sm">
                      <div>
                        <p className="text-yellow-400 font-bold">{s.emas}</p>
                        <p className="text-slate-500 text-xs">E</p>
                      </div>
                      <div>
                        <p className="text-gray-300 font-bold">{s.perak}</p>
                        <p className="text-slate-500 text-xs">P</p>
                      </div>
                      <div>
                        <p className="text-orange-400 font-bold">{s.gangsa}</p>
                        <p className="text-slate-500 text-xs">G</p>
                      </div>
                      <div>
                        <p className="text-white font-bold">{s.total_mata}</p>
                        <p className="text-slate-500 text-xs">Mata</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-12">Tiada keputusan lagi.</p>
            )}
          </div>
        )}

        {activeTab === 'keputusan' && (
          <div className="space-y-6">
            {acaraList.length ? acaraList.map((acara) => (
              <div key={acara.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <h3 className="font-semibold mb-3">
                  {acara.nama_acara}
                  <span className="text-slate-400 text-sm font-normal ml-2">
                    {acara.kategori} · {acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
                  </span>
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs">
                      <th className="text-left pb-2">#</th>
                      <th className="text-left pb-2">Atlet</th>
                      <th className="text-left pb-2">Sekolah</th>
                      <th className="text-right pb-2">Keputusan</th>
                      <th className="text-right pb-2">Sijil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(initialRankings[acara.id] ?? []).map((r: any) => (
                      <tr key={r.athlete_id} className="border-t border-slate-700">
                        <td className="py-2 text-slate-400">{r.kedudukan ?? '-'}</td>
                        <td className="py-2">{r.athletes?.name}</td>
                        <td className="py-2 text-slate-400 text-xs">{r.schools?.name}</td>
                        <td className="py-2 text-right font-mono">{formatValue(r.nilai_terbaik, acara.unit)}</td>
                        <td className="py-2 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded border ${sijilColor[r.sijil] ?? ''}`}>
                            {r.sijil}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )) : (
              <p className="text-slate-500 text-center py-12">Tiada acara selesai lagi.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
