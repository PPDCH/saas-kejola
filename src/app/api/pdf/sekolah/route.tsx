import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20, textAlign: 'center' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', padding: 6 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', padding: 6, backgroundColor: '#f9fafb' },
  headerText: { color: 'white', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  colRank: { width: '8%' },
  colSchool: { width: '40%' },
  colMedal: { width: '13%', textAlign: 'center' },
  colMata: { width: '13%', textAlign: 'center', fontFamily: 'Helvetica-Bold' },
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

  const { data: standings } = await supabase
    .from('school_standings')
    .select('*, schools(name)')
    .eq('event_id', eventId)
    .order('ranking', { nullsFirst: false })

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subtitle}>
          {event.peringkat} · {event.location} · {event.date_start} — {event.date_end}
        </Text>
        <Text style={styles.subtitle}>LAPORAN KEDUDUKAN SEKOLAH</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colRank, styles.headerText]}>#</Text>
          <Text style={[styles.colSchool, styles.headerText]}>Sekolah</Text>
          <Text style={[styles.colMedal, styles.headerText]}>Emas</Text>
          <Text style={[styles.colMedal, styles.headerText]}>Perak</Text>
          <Text style={[styles.colMedal, styles.headerText]}>Gangsa</Text>
          <Text style={[styles.colMata, styles.headerText]}>Mata</Text>
        </View>
        {(standings ?? []).map((s: any, idx: number) => (
          <View key={s.id} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colRank}>{s.ranking ?? idx + 1}</Text>
            <Text style={styles.colSchool}>{s.schools?.name}</Text>
            <Text style={styles.colMedal}>{s.emas}</Text>
            <Text style={styles.colMedal}>{s.perak}</Text>
            <Text style={styles.colMedal}>{s.gangsa}</Text>
            <Text style={styles.colMata}>{s.total_mata}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(doc)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="laporan-sekolah-${eventId}.pdf"`,
    },
  })
}
