'use client'
import { useState } from 'react'
import { createUser } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Tenant = { id: string; name: string; slug: string }

export default function CreateUserForm({ tenants }: { tenants: Tenant[] }) {
  const [role, setRole] = useState('ADMIN')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  return (
    <div className="bg-white rounded-lg border p-5">
      <h2 className="font-semibold mb-4">Cipta Pengguna Baru</h2>
      <form
        action={async (fd) => {
          setLoading(true)
          setError('')
          setSuccess('')
          fd.set('role', role)
          fd.set('tenant_id', tenantId)
          const result = await createUser(fd)
          if (result?.error) setError(result.error)
          else {
            setSuccess('Pengguna berjaya dicipta.')
            ;(document.querySelector('#create-user-form') as HTMLFormElement)?.reset()
            setTenantId('')
          }
          setLoading(false)
        }}
        id="create-user-form"
        className="space-y-3"
      >
        <div>
          <Label>Nama Penuh</Label>
          <Input name="name" placeholder="Ahmad bin Ali" required />
        </div>
        <div>
          <Label>Emel</Label>
          <Input name="email" type="email" placeholder="ahmad@ppd.edu.my" required />
        </div>
        <div>
          <Label>Kata Laluan Sementara</Label>
          <Input name="password" type="password" placeholder="Min 6 aksara" minLength={6} required />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => v && setRole(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PLATFORM_OWNER">Platform Owner</SelectItem>
              <SelectItem value="SUPERADMIN">Superadmin (PPD)</SelectItem>
              <SelectItem value="ADMIN">Admin (Sekolah)</SelectItem>
              <SelectItem value="HAKIM">Hakim</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tenant</Label>
          <Select value={tenantId} onValueChange={(v) => v && setTenantId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="-- Pilih tenant --" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Mencipta...' : 'Cipta Pengguna'}
        </Button>
      </form>
    </div>
  )
}
