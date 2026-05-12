'use client'
import { useState } from 'react'
import { use } from 'react'
import { createAcara, addAcaraFromTemplate } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'

const ACARA_STANDARD = [
  { nama: '100m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '200m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '400m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '800m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '1500m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '3000m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '5000m', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '110m Berpagar', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '400m Berpagar', jenis: 'TREK', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '4x100m Rejang', jenis: 'REJANG', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: '4x400m Rejang', jenis: 'REJANG', unit: 'MASA_MS', arah: 'RENDAH' },
  { nama: 'Lompat Jauh', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lompat Tinggi', jenis: 'PADANG', unit: 'KETINGGIAN_MM', arah: 'TINGGI' },
  { nama: 'Lompat Kijang', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lontar Peluru', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lempar Cakera', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
  { nama: 'Lempar Lembing', jenis: 'PADANG', unit: 'JARAK_MM', arah: 'TINGGI' },
]

export default function TambahAcaraPage({
  params,
}: {
  params: Promise<{ tenant: string; eventId: string }>
}) {
  const { tenant, eventId } = use(params)
  const [jenis, setJenis] = useState('TREK')
  const [jantina, setJantina] = useState('L')
  const [kategori, setKategori] = useState('B16')
  const [unit, setUnit] = useState('MASA_MS')
  const [arah, setArah] = useState('RENDAH')
  const [loading, setLoading] = useState(false)
  const [templateJantina, setTemplateJantina] = useState('L')
  const [templateKategori, setTemplateKategori] = useState('B16')
  const [selected, setSelected] = useState<string[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)

  const toggleTemplate = (nama: string) => {
    setSelected((prev) =>
      prev.includes(nama) ? prev.filter((n) => n !== nama) : [...prev, nama]
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${tenant}/events/${eventId}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Balik ke Kejohanan
        </Link>
        <h1 className="text-2xl font-bold">Tambah Acara</h1>
      </div>

      {/* Template bulk add */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Tambah dari Template Standard Malaysia</h2>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <Label>Jantina</Label>
            <Select value={templateJantina} onValueChange={(v) => v && setTemplateJantina(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Lelaki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Kategori</Label>
            <Select value={templateKategori} onValueChange={(v) => v && setTemplateKategori(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['B12','B14','B16','B18','TERBUKA'].map(k => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {ACARA_STANDARD.map((a) => (
            <button
              key={a.nama}
              type="button"
              onClick={() => toggleTemplate(a.nama)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selected.includes(a.nama)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-300 hover:border-blue-400'
              }`}
            >
              {a.nama}
            </button>
          ))}
        </div>
        <Button
          type="button"
          disabled={selected.length === 0 || templateLoading}
          onClick={async () => {
            setTemplateLoading(true)
            const templates = ACARA_STANDARD.filter((a) => selected.includes(a.nama))
            await addAcaraFromTemplate(templates, templateJantina, templateKategori, tenant, eventId)
            setSelected([])
            setTemplateLoading(false)
          }}
        >
          {templateLoading ? 'Menambah...' : `Tambah ${selected.length} Acara`}
        </Button>
      </div>

      {/* Manual add */}
      <h2 className="font-semibold mb-3">Atau Tambah Manual</h2>
      <form
        action={async (fd) => {
          setLoading(true)
          fd.set('jenis', jenis)
          fd.set('jantina', jantina)
          fd.set('kategori', kategori)
          fd.set('unit', unit)
          fd.set('arah_terbaik', arah)
          const result = await createAcara(fd, tenant, eventId)
          if (!result?.error) {
            (document.querySelector('form') as HTMLFormElement)?.reset()
          }
          setLoading(false)
        }}
        className="space-y-4 bg-white p-6 rounded-lg border"
      >
        <div>
          <Label>Nama Acara</Label>
          <Input name="nama_acara" placeholder="100m Lelaki B16" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Jenis</Label>
            <Select value={jenis} onValueChange={(v) => v && setJenis(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TREK">Trek</SelectItem>
                <SelectItem value="PADANG">Padang</SelectItem>
                <SelectItem value="REJANG">Rejang</SelectItem>
              </SelectContent>
            </Select>
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
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Kategori</Label>
            <Select value={kategori} onValueChange={(v) => v && setKategori(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['B12','B14','B16','B18','TERBUKA'].map(k => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unit Keputusan</Label>
            <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MASA_MS">Masa (ms)</SelectItem>
                <SelectItem value="JARAK_MM">Jarak (mm)</SelectItem>
                <SelectItem value="KETINGGIAN_MM">Ketinggian (mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Arah Terbaik</Label>
            <Select value={arah} onValueChange={(v) => v && setArah(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RENDAH">Rendah (masa)</SelectItem>
                <SelectItem value="TINGGI">Tinggi (jarak)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Max Peserta/Sekolah</Label>
            <Input name="max_peserta_sekolah" type="number" defaultValue={2} min={1} max={10} />
          </div>
          <div>
            <Label>Bilangan Heat</Label>
            <Input name="bilangan_heat" type="number" defaultValue={1} min={1} max={10} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Menambah...' : '+ Tambah Acara'}
        </Button>
      </form>
    </div>
  )
}
