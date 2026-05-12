'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export async function daftarAtlet(
  athleteId: string,
  eventAcaraId: string,
  tenantSlug: string,
  eventId: string
) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  // Semak event status mesti OPEN
  const { data: event } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .single()

  if (event?.status !== 'OPEN') return { error: 'Pendaftaran tidak dibuka.' }

  // Semak acara wujud dan dapatkan maklumat
  const { data: acara } = await supabase
    .from('event_acara')
    .select('*')
    .eq('id', eventAcaraId)
    .single()

  if (!acara) return { error: 'Acara tidak dijumpai.' }

  // Semak atlet
  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single()

  if (!athlete) return { error: 'Atlet tidak dijumpai.' }

  // Semak jantina sesuai
  if (athlete.jantina !== acara.jantina) {
    return { error: 'Jantina atlet tidak sesuai dengan acara ini.' }
  }

  // Semak kategori sesuai
  if (athlete.kategori !== acara.kategori) {
    return { error: `Kategori atlet (${athlete.kategori}) tidak sesuai dengan acara (${acara.kategori}).` }
  }

  // Semak had max_peserta_sekolah
  const { count: existingCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_acara_id', eventAcaraId)
    .eq('school_id', athlete.school_id)
    .in('status', ['PENDING', 'APPROVED'])

  if ((existingCount ?? 0) >= acara.max_peserta_sekolah) {
    return { error: `Had maksimum ${acara.max_peserta_sekolah} peserta sekolah untuk acara ini sudah penuh.` }
  }

  const { error } = await supabase.from('registrations').insert({
    event_acara_id: eventAcaraId,
    athlete_id: athleteId,
    school_id: athlete.school_id,
    status: 'PENDING',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Atlet sudah didaftarkan untuk acara ini.' }
    return { error: 'Gagal mendaftar atlet.' }
  }

  revalidatePath(`/${tenantSlug}/events/${eventId}/daftar`)
  return { success: true }
}

export async function batalDaftarAtlet(
  registrationId: string,
  tenantSlug: string,
  eventId: string
) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase.from('registrations').delete().eq('id', registrationId)
  if (error) return { error: 'Gagal batal pendaftaran.' }

  revalidatePath(`/${tenantSlug}/events/${eventId}/daftar`)
  return { success: true }
}
