import { createClient } from '@/lib/supabase/server'

const MATA_TABLE = [8, 7, 6, 5, 4, 3, 2, 1]

export async function calculateRankings(eventAcaraId: string) {
  const supabase = await createClient()

  // Dapatkan acara untuk tahu arah_terbaik
  const { data: acara } = await supabase
    .from('event_acara')
    .select('arah_terbaik, event_id')
    .eq('id', eventAcaraId)
    .single()

  if (!acara) return { error: 'Acara tidak dijumpai.' }

  // Ambil semua heat lanes + results untuk acara ini
  const { data: heats } = await supabase
    .from('heats')
    .select('id')
    .eq('event_acara_id', eventAcaraId)

  if (!heats?.length) return { error: 'Tiada heat untuk acara ini.' }

  const heatIds = heats.map((h) => h.id)

  const { data: lanes } = await supabase
    .from('heat_lanes')
    .select('id, athlete_id, athletes(school_id), results(value, status)')
    .in('heat_id', heatIds)

  if (!lanes?.length) return { error: 'Tiada data lane.' }

  // Kumpulkan nilai terbaik per atlet
  type AtletResult = {
    athleteId: string
    schoolId: string
    bestValue: number | null
    status: string
  }

  const atletMap: Record<string, AtletResult> = {}

  for (const lane of lanes) {
    const results = (lane.results as any[]) ?? []
    const athlete = lane.athletes as any

    if (!atletMap[lane.athlete_id]) {
      atletMap[lane.athlete_id] = {
        athleteId: lane.athlete_id,
        schoolId: athlete?.school_id,
        bestValue: null,
        status: 'DNS',
      }
    }

    for (const result of results) {
      if (result.status !== 'COMPLETED' || result.value === null) continue

      const current = atletMap[lane.athlete_id]
      const isBetter = current.bestValue === null || (
        acara.arah_terbaik === 'RENDAH'
          ? result.value < current.bestValue
          : result.value > current.bestValue
      )

      if (isBetter) {
        atletMap[lane.athlete_id].bestValue = result.value
        atletMap[lane.athlete_id].status = 'COMPLETED'
      }
    }
  }

  // Sort: COMPLETED dulu, sisanya di bawah
  const sorted = Object.values(atletMap).sort((a, b) => {
    if (a.status !== 'COMPLETED' && b.status !== 'COMPLETED') return 0
    if (a.status !== 'COMPLETED') return 1
    if (b.status !== 'COMPLETED') return -1
    if (a.bestValue === null || b.bestValue === null) return 0
    return acara.arah_terbaik === 'RENDAH'
      ? a.bestValue - b.bestValue
      : b.bestValue - a.bestValue
  })

  // Assign kedudukan, mata, sijil
  const rankingRows = sorted.map((atlet, idx) => {
    const kedudukan = atlet.status === 'COMPLETED' ? idx + 1 : null
    const mata = atlet.status === 'COMPLETED' ? (MATA_TABLE[idx] ?? 0) : 0
    const sijil = kedudukan === 1 ? 'EMAS'
      : kedudukan === 2 ? 'PERAK'
      : kedudukan === 3 ? 'GANGSA'
      : 'HADIR'

    return {
      event_acara_id: eventAcaraId,
      athlete_id: atlet.athleteId,
      school_id: atlet.schoolId,
      kedudukan,
      nilai_terbaik: atlet.bestValue,
      mata,
      sijil,
    }
  })

  // Upsert rankings
  for (const row of rankingRows) {
    await supabase
      .from('rankings')
      .upsert(row, { onConflict: 'event_acara_id,athlete_id' })
  }

  // Recalculate school standings
  await recalculateSchoolStandings(acara.event_id)

  return { success: true }
}

async function recalculateSchoolStandings(eventId: string) {
  const supabase = await createClient()

  // Ambil semua rankings untuk event ini
  const { data: acaraList } = await supabase
    .from('event_acara')
    .select('id')
    .eq('event_id', eventId)

  if (!acaraList?.length) return

  const acaraIds = acaraList.map((a) => a.id)

  const { data: rankings } = await supabase
    .from('rankings')
    .select('school_id, mata, sijil')
    .in('event_acara_id', acaraIds)

  if (!rankings) return

  // Aggregate per sekolah
  const standingsMap: Record<string, { total_mata: number; emas: number; perak: number; gangsa: number }> = {}

  for (const r of rankings) {
    if (!standingsMap[r.school_id]) {
      standingsMap[r.school_id] = { total_mata: 0, emas: 0, perak: 0, gangsa: 0 }
    }
    standingsMap[r.school_id].total_mata += r.mata ?? 0
    if (r.sijil === 'EMAS') standingsMap[r.school_id].emas++
    if (r.sijil === 'PERAK') standingsMap[r.school_id].perak++
    if (r.sijil === 'GANGSA') standingsMap[r.school_id].gangsa++
  }

  // Sort by emas → perak → gangsa → mata
  const sorted = Object.entries(standingsMap).sort(([, a], [, b]) => {
    if (b.emas !== a.emas) return b.emas - a.emas
    if (b.perak !== a.perak) return b.perak - a.perak
    if (b.gangsa !== a.gangsa) return b.gangsa - a.gangsa
    return b.total_mata - a.total_mata
  })

  for (let i = 0; i < sorted.length; i++) {
    const [schoolId, data] = sorted[i]
    await supabase
      .from('school_standings')
      .upsert(
        { event_id: eventId, school_id: schoolId, ...data, ranking: i + 1 },
        { onConflict: 'event_id,school_id' }
      )
  }
}
