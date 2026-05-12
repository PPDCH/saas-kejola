'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Trophy, Users, School, LogOut } from 'lucide-react'
import { logout } from '@/app/[tenant]/login/actions'

const navItems = (tenant: string, role: string) => {
  const base = [
    { href: `/${tenant}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${tenant}/events`, label: 'Kejohanan', icon: Trophy },
  ]
  if (['SUPERADMIN', 'PLATFORM_OWNER'].includes(role)) {
    base.push(
      { href: `/${tenant}/schools`, label: 'Sekolah', icon: School },
      { href: `/${tenant}/users`, label: 'Pengguna', icon: Users },
    )
  }
  if (role === 'ADMIN') {
    base.push({ href: `/${tenant}/athletes`, label: 'Atlet', icon: Users })
  }
  if (role === 'HAKIM') {
    base.push({ href: `/${tenant}/hakim`, label: 'Rekod Keputusan', icon: Trophy })
  }
  return base
}

export function Sidebar({ tenant, role }: { tenant: string; role: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="font-bold text-lg">Kejola</h1>
        <p className="text-slate-400 text-sm mt-1">{tenant}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems(tenant, role).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => logout(tenant)}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Keluar
        </button>
      </div>
    </aside>
  )
}
