'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export async function createAcara(formData: FormData, tenantSlug: string, eventId: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase.from('event_acara').insert({
    event_id: eventId,
    nama_acara: formData.get('nama_acara'),
    jenis: formData.get('jenis'),
    jantina: formData.get('jantina'),
    kategori: formData.get('kategori'),
    unit: formData.get('unit'),
    arah_terbaik: formData.get('arah_terbaik'),
    max_peserta_sekolah: Number(formData.get('max_peserta_sekolah')) || 2,
    bilangan_heat: Number(formData.get('bilangan_heat')) || 1,
  })

  if (error) return { error: 'Gagal tambah acara.' }
  revalidatePath(`/${tenantSlug}/events/${eventId}`)
  return { success: true }
}

export async function addAcaraFromTemplate(
  templates: Array<{ nama: string; jenis: string; unit: string; arah: string }>,
  jantina: string,
  kategori: string,
  tenantSlug: string,
  eventId: string
) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const rows = templates.map((t) => ({
    event_id: eventId,
    nama_acara: t.nama,
    jenis: t.jenis,
    jantina,
    kategori,
    unit: t.unit,
    arah_terbaik: t.arah,
    max_peserta_sekolah: 2,
    bilangan_heat: 1,
  }))

  const { error } = await supabase.from('event_acara').insert(rows)
  if (error) return { error: 'Gagal tambah acara dari template.' }
  revalidatePath(`/${tenantSlug}/events/${eventId}`)
  return { success: true }
}

export async function deleteAcara(acaraId: string, tenantSlug: string, eventId: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase.from('event_acara').delete().eq('id', acaraId)
  if (error) return { error: 'Gagal padam acara.' }
  revalidatePath(`/${tenantSlug}/events/${eventId}`)
  return { success: true }
}
