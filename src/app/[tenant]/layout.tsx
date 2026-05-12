import { getTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)

  if (!tenant) notFound()

  return <>{children}</>
}
