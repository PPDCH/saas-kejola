'use client'
import { useState } from 'react'
import { daftarAtlet, batalDaftarAtlet } from './actions'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

type Athlete = { id: string; name: string; jantina: string; kategori: string }
type Acara = { id: string; nama_acara: string; jantina: string; kategori: string; max_peserta_sekolah: number }
type Registration = { id: string; athlete_id: string; event_acara_id: string; status: string; athletes: any; event_acara: any }

export default function DaftarForm({
  tenant,
  eventId,
  athletes,
  acaraList,
  registrations,
}: {
  tenant: string
  eventId: string
  athletes: Athlete[]
  acaraList: Acara[]
  registrations: Registration[]
}) {
  const [athleteId, setAthleteId] = useState('')
  const [acaraId, setAcaraId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedAthlete = athletes.find((a) => a.id === athleteId)
  const filteredAcara = selectedAthlete
    ? acaraList.filter(
        (a) => a.jantina === selectedAthlete.jantina && a.kategori === selectedAthlete.kategori
      )
    : acaraList

  return (
    <div className="space-y-6">
      {/* Form daftar */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">Daftar Atlet ke Acara</h2>
        <div>
          <Label>Pilih Atlet</Label>
          <Select value={athleteId} onValueChange={(v) => { if (v) { setAthleteId(v); setAcaraId('') } }}>
            <SelectTrigger>
              <SelectValue placeholder="-- Pilih atlet --" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.jantina === 'L' ? 'L' : 'P'} · {a.kategori})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Pilih Acara</Label>
          <Select value={acaraId} onValueChange={(v) => v && setAcaraId(v)} disabled={!athleteId}>
            <SelectTrigger>
              <SelectValue placeholder={athleteId ? '-- Pilih acara --' : 'Pilih atlet dahulu'} />
            </SelectTrigger>
            <SelectContent>
              {filteredAcara.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nama_acara}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAthlete && filteredAcara.length === 0 && (
            <p className="text-sm text-yellow-600 mt-1">
              Tiada acara sesuai untuk {selectedAthlete.jantina === 'L' ? 'Lelaki' : 'Perempuan'} {selectedAthlete.kategori}.
            </p>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <Button
          disabled={!athleteId || !acaraId || loading}
          onClick={async () => {
            setLoading(true)
            setError('')
            setSuccess('')
            const result = await daftarAtlet(athleteId, acaraId, tenant, eventId)
            if (result?.error) setError(result.error)
            else { setSuccess('Berjaya didaftarkan!'); setAthleteId(''); setAcaraId('') }
            setLoading(false)
          }}
        >
          {loading ? 'Mendaftar...' : 'Daftar'}
        </Button>
      </div>

      {/* Senarai pendaftaran */}
      <div>
        <h2 className="font-semibold mb-3">Pendaftaran Semasa ({registrations.length})</h2>
        {registrations.length ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">Atlet</th>
                  <th className="text-left p-3 font-medium">Acara</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="border-t">
                    <td className="p-3">{reg.athletes?.name}</td>
                    <td className="p-3">{reg.event_acara?.nama_acara}</td>
                    <td className="p-3">
                      <Badge variant={reg.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        className="text-red-500 hover:text-red-700 text-xs"
                        onClick={async () => {
                          await batalDaftarAtlet(reg.id, tenant, eventId)
                        }}
                      >
                        Batal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Tiada pendaftaran lagi.</p>
        )}
      </div>
    </div>
  )
}
