'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTenant(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak log masuk.' }

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'PLATFORM_OWNER') return { error: 'Tiada kebenaran.' }

  const slug = (formData.get('name') as string)
    .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { error } = await supabase.from('tenants').insert({
    slug,
    name: formData.get('name'),
    type: formData.get('type'),
    status: 'ACTIVE',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Tenant dengan nama ini sudah wujud.' }
    return { error: 'Gagal cipta tenant.' }
  }

  revalidatePath('/admin/tenants')
  redirect('/admin/tenants')
}

export async function updateTenantStatus(tenantId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants').update({ status }).eq('id', tenantId)
  if (error) return { error: 'Gagal kemaskini status.' }
  revalidatePath('/admin/tenants')
  return { success: true }
}
