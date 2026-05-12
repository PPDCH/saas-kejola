'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function generateHeats(eventAcaraId: string, tenantSlug: string, eventId: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  // Dapatkan acara untuk tahu bilangan_heat
  const { data: acara } = await supabase
    .from('event_acara')
    .select('bilangan_heat')
    .eq('id', eventAcaraId)
    .single()

  if (!acara) return { error: 'Acara tidak dijumpai.' }

  // Ambil semua peserta APPROVED
  const { data: registrations } = await supabase
    .from('registrations')
    .select('athlete_id')
    .eq('event_acara_id', eventAcaraId)
    .eq('status', 'APPROVED')

  if (!registrations?.length) return { error: 'Tiada peserta diluluskan untuk acara ini.' }

  // Padam heats lama
  const { data: oldHeats } = await supabase
    .from('heats')
    .select('id')
    .eq('event_acara_id', eventAcaraId)

  if (oldHeats?.length) {
    const oldHeatIds = oldHeats.map((h) => h.id)
    await supabase.from('heat_lanes').delete().in('heat_id', oldHeatIds)
    await supabase.from('heats').delete().eq('event_acara_id', eventAcaraId)
  }

  // Shuffle peserta
  const shuffled = shuffle(registrations.map((r) => r.athlete_id))
  const bilHeat = acara.bilangan_heat

  // Cipta heats
  const heatRows = Array.from({ length: bilHeat }, (_, i) => ({
    event_acara_id: eventAcaraId,
    heat_number: i + 1,
    round: 'HEAT' as const,
    status: 'UPCOMING' as const,
  }))

  const { data: createdHeats, error: heatError } = await supabase
    .from('heats')
    .insert(heatRows)
    .select()

  if (heatError || !createdHeats) return { error: 'Gagal cipta heat.' }

  // Bahagi peserta kepada heats (round-robin)
  const laneRows: { heat_id: string; athlete_id: string; lane_number: number }[] = []
  const laneCounters: Record<string, number> = {}

  shuffled.forEach((athleteId, idx) => {
    const heat = createdHeats[idx % bilHeat]
    laneCounters[heat.id] = (laneCounters[heat.id] ?? 0) + 1
    laneRows.push({
      heat_id: heat.id,
      athlete_id: athleteId,
      lane_number: laneCounters[heat.id],
    })
  })

  const { error: laneError } = await supabase.from('heat_lanes').insert(laneRows)
  if (laneError) return { error: 'Gagal assign lane.' }

  revalidatePath(`/${tenantSlug}/events/${eventId}/heats`)
  return { success: true }
}

export async function updateHeatStatus(heatId: string, status: string, tenantSlug: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('heats').update({ status }).eq('id', heatId)
  if (error) return { error: 'Gagal kemaskini status heat.' }
  revalidatePath(`/${tenantSlug}/events/${eventId}/heats`)
  return { success: true }
}
