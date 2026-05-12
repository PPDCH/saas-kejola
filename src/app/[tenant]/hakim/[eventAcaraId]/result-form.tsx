'use client'
import { useState } from 'react'
import { submitResult } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const unitPlaceholder: Record<string, string> = {
  MASA_MS: 'contoh: 12.34 (saat)',
  JARAK_MM: 'contoh: 7.25 (meter)',
  KETINGGIAN_MM: 'contoh: 1.85 (meter)',
}

export default function ResultForm({
  heatLaneId,
  unit,
  existing,
  tenant,
  eventAcaraId,
}: {
  heatLaneId: string
  unit: string
  existing: any
  tenant: string
  eventAcaraId: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(existing?.status === 'COMPLETED' && existing?.value
    ? (existing.value / 1000).toFixed(2)
    : '')
  const [status, setStatus] = useState(existing?.status ?? 'COMPLETED')
  const [wind, setWind] = useState(existing?.wind_reading?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant={existing ? 'outline' : 'default'} type="button">
          {existing ? 'Edit' : 'Rekod'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rekod Keputusan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="DNF">DNF (Tidak Tamat)</SelectItem>
                <SelectItem value="DNS">DNS (Tidak Mula)</SelectItem>
                <SelectItem value="DQ">DQ (Diskualifikasi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === 'COMPLETED' && (
            <div>
              <Label>Keputusan</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={unitPlaceholder[unit]}
                type="number"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {unit === 'MASA_MS' ? 'Masukkan dalam saat (contoh: 12.34 = 12.34s)'
                  : 'Masukkan dalam meter (contoh: 7.25 = 7.25m)'}
              </p>
            </div>
          )}
          {unit === 'MASA_MS' && status === 'COMPLETED' && (
            <div>
              <Label>Bacaan Angin (m/s, optional)</Label>
              <Input
                value={wind}
                onChange={(e) => setWind(e.target.value)}
                placeholder="+1.2"
                type="number"
                step="0.1"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            className="w-full"
            disabled={loading || (status === 'COMPLETED' && !value)}
            onClick={async () => {
              setLoading(true)
              setError('')
              const result = await submitResult(heatLaneId, value, status, wind, unit, tenant, eventAcaraId)
              if (result?.error) setError(result.error)
              else setOpen(false)
              setLoading(false)
            }}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
