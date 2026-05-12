'use client'
import { useState } from 'react'
import { createTenant } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function CreateTenantPage() {
  const [type, setType] = useState('PPD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tenants" className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik
        </Link>
        <h1 className="text-2xl font-bold">Tenant Baru</h1>
      </div>
      <form
        action={async (fd) => {
          setLoading(true)
          fd.set('type', type)
          const result = await createTenant(fd)
          if (result?.error) {
            setError(result.error)
            setLoading(false)
          }
        }}
        className="space-y-4 bg-white p-6 rounded-lg border"
      >
        <div>
          <Label>Nama Tenant</Label>
          <Input name="name" placeholder="PPD Cameron Highlands" required />
          <p className="text-xs text-muted-foreground mt-1">
            Slug URL akan dijana automatik dari nama ini.
          </p>
        </div>
        <div>
          <Label>Jenis</Label>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PPD">PPD (Pejabat Pendidikan Daerah)</SelectItem>
              <SelectItem value="SEKOLAH">Sekolah</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Mencipta...' : 'Cipta Tenant'}
        </Button>
      </form>
    </div>
  )
}
