import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TenantStatusButton from './tenant-status-button'

export default async function TenantsPage() {
  const supabase = await createClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, users(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Senarai Tenant</h1>
        <Link href="/admin/tenants/create">
          <Button>+ Tenant Baru</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-muted-foreground">
            <tr>
              <th className="text-left p-4 font-medium">Nama</th>
              <th className="text-left p-4 font-medium">Slug</th>
              <th className="text-left p-4 font-medium">Jenis</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Dicipta</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {tenants?.map((tenant) => (
              <tr key={tenant.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{tenant.name}</td>
                <td className="p-4 font-mono text-xs text-muted-foreground">/{tenant.slug}</td>
                <td className="p-4">
                  <Badge variant="outline">{tenant.type}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {tenant.status}
                  </Badge>
                </td>
                <td className="p-4 text-muted-foreground text-xs">
                  {new Date(tenant.created_at).toLocaleDateString('ms-MY')}
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link href={`/${tenant.slug}/dashboard`} target="_blank">
                      <Button variant="ghost" size="sm">Buka →</Button>
                    </Link>
                    <TenantStatusButton
                      tenantId={tenant.id}
                      currentStatus={tenant.status}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!tenants?.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Tiada tenant lagi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
