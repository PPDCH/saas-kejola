import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '-'
  if (unit === 'MASA_MS') {
    const minutes = Math.floor(value / 60000)
    const seconds = Math.floor((value % 60000) / 1000)
    const cs = Math.floor((value % 1000) / 10)
    if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
    return `${seconds}.${String(cs).padStart(2, '0')}`
  }
  return `${(value / 1000).toFixed(2)}m`
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 16, textAlign: 'center' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 14, backgroundColor: '#f3f4f6', padding: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', padding: 4 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', padding: 4, backgroundColor: '#f9fafb' },
  col1: { width: '8%', fontFamily: 'Helvetica-Bold' },
  col2: { width: '32%' },
  col3: { width: '30%', color: '#666' },
  col4: { width: '18%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  col5: { width: '12%', textAlign: 'center' },
  headerText: { color: 'white', fontSize: 9, fontFamily: 'Helvetica-Bold' },
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  const tenantId = searchParams.get('tenantId')

  if (!eventId || !tenantId) return new NextResponse('Missing params', { status: 400 })

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events').select('*').eq('id', eventId).eq('tenant_id', tenantId).single()
  if (!event) return new NextResponse('Not found', { status: 404 })

  const { data: acaraList } = await supabase
    .from('event_acara').select('*').eq('event_id', eventId).order('nama_acara')

  const allRankings: Record<string, any[]> = {}
  for (const acara of acaraList ?? []) {
    const { data } = await supabase
      .from('rankings')
      .select('kedudukan, nilai_terbaik, sijil, mata, athletes(name), schools(name)')
      .eq('event_acara_id', acara.id)
      .order('kedudukan', { nullsFirst: false })
    allRankings[acara.id] = data ?? []
  }

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subtitle}>
          {event.peringkat} · {event.location} · {event.date_start} — {event.date_end}
        </Text>
        <Text style={styles.subtitle}>KEPUTUSAN RASMI</Text>
        {(acaraList ?? []).map((acara) => (
          <View key={acara.id}>
            <Text style={styles.sectionTitle}>
              {acara.nama_acara} — {acara.kategori} {acara.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>#</Text>
              <Text style={[styles.col2, styles.headerText]}>Atlet</Text>
              <Text style={[styles.col3, styles.headerText]}>Sekolah</Text>
              <Text style={[styles.col4, styles.headerText]}>Keputusan</Text>
              <Text style={[styles.col5, styles.headerText]}>Sijil</Text>
            </View>
            {(allRankings[acara.id] ?? []).length === 0 && (
              <View style={styles.tableRow}>
                <Text style={{ color: '#999', fontSize: 9 }}>Tiada keputusan.</Text>
              </View>
            )}
            {(allRankings[acara.id] ?? []).map((r: any, idx: number) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.col1}>{r.kedudukan ?? '-'}</Text>
                <Text style={styles.col2}>{r.athletes?.name}</Text>
                <Text style={styles.col3}>{r.schools?.name}</Text>
                <Text style={styles.col4}>{formatValue(r.nilai_terbaik, acara.unit)}</Text>
                <Text style={styles.col5}>{r.sijil}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(doc)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="keputusan-${eventId}.pdf"`,
    },
  })
}
