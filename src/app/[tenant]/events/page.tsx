import { createClient } from '@/lib/supabase/server'
import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const statusColor: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  OPEN: 'default',
  CLOSED: 'outline',
  ONGOING: 'default',
  COMPLETED: 'secondary',
}

const statusLabel: Record<string, string> = {
  DRAFT: 'Draf',
  OPEN: 'Buka',
  CLOSED: 'Tutup',
  ONGOING: 'Sedang Berlangsung',
  COMPLETED: 'Selesai',
}

export default async function EventsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  const user = await getCurrentUser(tenant.id)

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('date_start', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kejohanan</h1>
        {['SUPERADMIN', 'PLATFORM_OWNER'].includes(user?.role) && (
          <Link href={`/${slug}/events/create`}>
            <Button>+ Cipta Kejohanan</Button>
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {events?.map((event) => (
          <Link key={event.id} href={`/${slug}/events/${event.id}`}>
            <div className="bg-white p-4 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{event.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {event.location && `${event.location} • `}
                    {event.date_start} — {event.date_end}
                  </p>
                </div>
                <Badge variant={statusColor[event.status]}>{statusLabel[event.status] ?? event.status}</Badge>
              </div>
            </div>
          </Link>
        ))}
        {!events?.length && (
          <p className="text-muted-foreground text-center py-12">Tiada kejohanan lagi.</p>
        )}
      </div>
    </div>
  )
}
