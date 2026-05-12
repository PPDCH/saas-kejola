import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Building2, Users } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'PLATFORM_OWNER') redirect('/')

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Tenant', icon: Building2 },
    { href: '/admin/users', label: 'Pengguna', icon: Users },
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 min-h-screen bg-slate-950 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-bold text-lg">Kejola Admin</h1>
          <p className="text-slate-500 text-xs mt-1">Platform Owner</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-slate-500 text-xs">
          {profile?.name}
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  )
}
