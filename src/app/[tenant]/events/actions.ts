'use server'
import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData, tenantSlug: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { data, error } = await supabase.from('events').insert({
    tenant_id: tenant.id,
    name: formData.get('name'),
    peringkat: formData.get('peringkat'),
    location: formData.get('location'),
    date_start: formData.get('date_start'),
    date_end: formData.get('date_end'),
    created_by: user.id,
  }).select().single()

  if (error || !data) return { error: 'Gagal cipta kejohanan.' }
  redirect(`/${tenantSlug}/events/${data.id}`)
}

export async function updateEventStatus(eventId: string, status: string, tenantSlug: string) {
  const supabase = await createClient()
  const tenant = await getTenant(tenantSlug)
  if (!tenant) return { error: 'Tenant tidak dijumpai.' }

  const user = await getCurrentUser(tenant.id)
  if (!user || !['SUPERADMIN', 'PLATFORM_OWNER'].includes(user.role)) {
    return { error: 'Tiada kebenaran.' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: 'Gagal kemaskini status.' }
  return { success: true }
}
