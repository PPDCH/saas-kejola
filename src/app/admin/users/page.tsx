import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import CreateUserForm from './create-user-form'

const roleColor: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PLATFORM_OWNER: 'default',
  SUPERADMIN: 'default',
  ADMIN: 'secondary',
  HAKIM: 'outline',
}

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*, tenants(name, slug)')
    .order('created_at', { ascending: false })

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('status', 'ACTIVE')
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Urus Pengguna</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form cipta pengguna */}
        <div className="lg:col-span-1">
          <CreateUserForm tenants={tenants ?? []} />
        </div>

        {/* Senarai pengguna */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">Nama</th>
                  <th className="text-left p-3 font-medium">Emel</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Tenant</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-muted-foreground text-xs">{user.email}</td>
                    <td className="p-3">
                      <Badge variant={roleColor[user.role] ?? 'outline'}>{user.role}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {(user.tenants as any)?.name ?? '-'}
                    </td>
                  </tr>
                ))}
                {!users?.length && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Tiada pengguna lagi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
