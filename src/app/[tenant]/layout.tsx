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

  let tenant = null
  try {
    tenant = await getTenant(slug)
  } catch (e) {
    console.error('[TenantLayout] getTenant threw:', e)
    throw e
  }

  if (!tenant) notFound()

  return <>{children}</>
}
