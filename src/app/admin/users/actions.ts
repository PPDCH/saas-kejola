'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const supabase = await createClient()

  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) return { error: 'Tidak log masuk.' }

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', me.id).single()
  if (profile?.role !== 'PLATFORM_OWNER') return { error: 'Tiada kebenaran.' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const tenantId = formData.get('tenant_id') as string

  // Cipta auth user menggunakan service role — panggil Supabase Admin API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })

  const authData = await res.json()
  if (!res.ok || !authData.id) {
    return { error: authData.message ?? 'Gagal cipta akaun.' }
  }

  // Insert ke users table
  const { error } = await supabase.from('users').insert({
    id: authData.id,
    tenant_id: tenantId || null,
    email,
    name,
    role,
  })

  if (error) return { error: 'Akaun dicipta tapi gagal simpan profil.' }

  revalidatePath('/admin/users')
  return { success: true }
}
