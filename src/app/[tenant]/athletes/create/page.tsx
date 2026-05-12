'use client'
import { useState } from 'react'
import { use } from 'react'
import { createAthlete } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateKategori } from '@/lib/kategori'
import Link from 'next/link'

export default function CreateAthletePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params)
  const [jantina, setJantina] = useState('L')
  const [tarikhLahir, setTarikhLahir] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const kategoriAuto = tarikhLahir
    ? calculateKategori(tarikhLahir, new Date().toISOString().split('T')[0])
    : '-'

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${tenant}/athletes`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik
        </Link>
        <h1 className="text-2xl font-bold">Daftar Atlet</h1>
      </div>
      <form
        action={async (fd) => {
          setLoading(true)
          fd.set('jantina', jantina)
          const result = await createAthlete(fd, tenant)
          if (result?.error) {
            setError(result.error)
            setLoading(false)
          }
        }}
        className="space-y-4 bg-white p-6 rounded-lg border"
      >
        <div>
          <Label>Nama Penuh</Label>
          <Input name="name" placeholder="Ahmad bin Ali" required />
        </div>
        <div>
          <Label>Nombor IC (tanpa sempang)</Label>
          <Input name="ic_number" placeholder="050312010001" required />
        </div>
        <div>
          <Label>Jantina</Label>
          <Select value={jantina} onValueChange={(v) => v && setJantina(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Lelaki</SelectItem>
              <SelectItem value="P">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tarikh Lahir</Label>
          <Input
            name="tarikh_lahir"
            type="date"
            required
            onChange={(e) => setTarikhLahir(e.target.value)}
          />
          {tarikhLahir && (
            <p className="text-sm text-muted-foreground mt-1">
              Kategori auto: <strong>{kategoriAuto}</strong>
            </p>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Mendaftar...' : 'Daftar Atlet'}
        </Button>
      </form>
    </div>
  )
}
