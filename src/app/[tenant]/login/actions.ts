'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData, tenantSlug: string) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Emel atau kata laluan tidak sah.' }

  redirect(`/${tenantSlug}/dashboard`)
}

export async function logout(tenantSlug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${tenantSlug}/login`)
}
