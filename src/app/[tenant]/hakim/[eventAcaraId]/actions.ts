'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { calculateRankings } from '@/lib/ranking'
import { revalidatePath } from 'next/cache'

function convertToStandardUnit(value: string, unit: string): number {
  const num = parseFloat(value)
  if (isNaN(num)) return 0
  if (unit === 'MASA_MS') return Math.round(num * 1000)
  if (unit === 'JARAK_MM') return Math.round(num * 1000)
  if (unit === 'KETINGGIAN_MM') return Math.round(num * 1000)
  return 0
}

export async function submitResult(
  heatLaneId: string,
  valueStr: string,
  status: string,
  windReading: string,
  unit: string,
  tenantSlug: string,
  eventAcaraId: string
) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['HAKIM', 'SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const value = status === 'COMPLETED' ? convertToStandardUnit(valueStr, unit) : null
  const wind = windReading ? parseFloat(windReading) : null

  // Upsert result
  const { data: existing } = await supabase
    .from('results')
    .select('id')
    .eq('heat_lane_id', heatLaneId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('results')
      .update({ value, wind_reading: wind, status, submitted_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: 'Gagal kemaskini keputusan.' }
  } else {
    const { error } = await supabase.from('results').insert({
      heat_lane_id: heatLaneId,
      value,
      wind_reading: wind,
      status,
      submitted_by: user.id,
    })
    if (error) return { error: 'Gagal simpan keputusan.' }
  }

  // Auto-recalculate rankings setiap kali keputusan disimpan
  await calculateRankings(eventAcaraId)

  revalidatePath(`/${tenantSlug}/hakim/${eventAcaraId}`)
  return { success: true }
}
