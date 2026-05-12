import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'

export default async function TenantPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{tenant.name}</h1>
      <p className="text-muted-foreground">Sistem Pengurusan Kejohanan Olahraga</p>
    </main>
  )
}
