import { createClient } from '@/lib/supabase/server'

export async function getTenant(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .single()

  if (error || !data) return null
  return data
}

export async function getCurrentUser(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  return data
}
