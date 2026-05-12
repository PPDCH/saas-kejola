'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export async function approveRegistration(regId: string, tenantSlug: string, eventId: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase
    .from('registrations')
    .update({ status: 'APPROVED' })
    .eq('id', regId)

  if (error) return { error: 'Gagal luluskan pendaftaran.' }
  revalidatePath(`/${tenantSlug}/events/${eventId}/pendaftaran`)
  return { success: true }
}

export async function rejectRegistration(regId: string, tenantSlug: string, eventId: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase
    .from('registrations')
    .update({ status: 'REJECTED' })
    .eq('id', regId)

  if (error) return { error: 'Gagal tolak pendaftaran.' }
  revalidatePath(`/${tenantSlug}/events/${eventId}/pendaftaran`)
  return { success: true }
}
