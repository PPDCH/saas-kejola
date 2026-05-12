import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import LeaderboardClient from './leaderboard-client'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ tenant: string; eventId: string }>
}) {
  const { tenant: slug, eventId } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('tenant_id', tenant.id)
    .single()
  if (!event) notFound()

  const { data: standings } = await supabase
    .from('school_standings')
    .select('*, schools(name, code)')
    .eq('event_id', eventId)
    .order('ranking', { nullsFirst: false })

  const { data: acaraList } = await supabase
    .from('event_acara')
    .select('id, nama_acara, kategori, jantina, unit, status')
    .eq('event_id', eventId)
    .eq('status', 'COMPLETED')
    .order('nama_acara')

  const rankingsByAcara: Record<string, any[]> = {}
  for (const acara of acaraList ?? []) {
    const { data: rankings } = await supabase
      .from('rankings')
      .select('kedudukan, nilai_terbaik, sijil, mata, athletes(name), schools(name)')
      .eq('event_acara_id', acara.id)
      .order('kedudukan', { nullsFirst: false })
      .limit(8)
    rankingsByAcara[acara.id] = rankings ?? []
  }

  return (
    <LeaderboardClient
      event={event}
      tenant={slug}
      standings={standings ?? []}
      acaraList={acaraList ?? []}
      rankingsByAcara={rankingsByAcara}
    />
  )
}
