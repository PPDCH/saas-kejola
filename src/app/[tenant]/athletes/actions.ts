'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { calculateKategori } from '@/lib/kategori'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAthlete(formData: FormData, tenantSlug: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const tarikhLahir = formData.get('tarikh_lahir') as string
  const kategori = calculateKategori(tarikhLahir, new Date().toISOString().split('T')[0])

  const schoolId = user.role === 'ADMIN'
    ? (await supabase.from('schools').select('id').eq('admin_user_id', user.id).single()).data?.id
    : formData.get('school_id') as string

  if (!schoolId) return { error: 'Sekolah tidak ditemui.' }

  const { error } = await supabase.from('athletes').insert({
    tenant_id: tenant.id,
    school_id: schoolId,
    name: formData.get('name'),
    ic_number: formData.get('ic_number'),
    tarikh_lahir: tarikhLahir,
    jantina: formData.get('jantina'),
    kategori,
  })

  if (error) return { error: 'Gagal tambah atlet. Semak nombor IC mungkin sudah wujud.' }
  revalidatePath(`/${tenantSlug}/athletes`)
  redirect(`/${tenantSlug}/athletes`)
}

export async function deleteAthlete(athleteId: string, tenantSlug: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER', 'ADMIN'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase.from('athletes').delete().eq('id', athleteId)
  if (error) return { error: 'Gagal padam atlet.' }
  revalidatePath(`/${tenantSlug}/athletes`)
  return { success: true }
}
