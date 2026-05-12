'use client'
import { useState } from 'react'
import { use } from 'react'
import { createEvent } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function CreateEventPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params)
  const [peringkat, setPeringkat] = useState('MSSD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${tenant}/events`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik
        </Link>
        <h1 className="text-2xl font-bold">Cipta Kejohanan</h1>
      </div>
      <form
        action={async (fd) => {
          setLoading(true)
          fd.set('peringkat', peringkat)
          const result = await createEvent(fd, tenant)
          if (result?.error) {
            setError(result.error)
            setLoading(false)
          }
        }}
        className="space-y-4 bg-white p-6 rounded-lg border"
      >
        <div>
          <Label>Nama Kejohanan</Label>
          <Input name="name" placeholder="MSSD Olahraga Cameron Highlands 2026" required />
        </div>
        <div>
          <Label>Peringkat</Label>
          <Select value={peringkat} onValueChange={(v) => v && setPeringkat(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SEKOLAH">Sekolah</SelectItem>
              <SelectItem value="MSSD">MSSD</SelectItem>
              <SelectItem value="MSSN">MSSN</SelectItem>
              <SelectItem value="MSSM">MSSM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lokasi</Label>
          <Input name="location" placeholder="Stadium Cameron Highlands" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tarikh Mula</Label>
            <Input name="date_start" type="date" required />
          </div>
          <div>
            <Label>Tarikh Tamat</Label>
            <Input name="date_end" type="date" required />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Mencipta...' : 'Cipta Kejohanan'}
        </Button>
      </form>
    </div>
  )
}
