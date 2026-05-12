import { getTenant, getCurrentUser } from '@/lib/tenant'
import { notFound, redirect } from 'next/navigation'
import { Sidebar } from '@/components/nav/sidebar'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenant(slug)
  if (!tenant) notFound()

  const user = await getCurrentUser(tenant.id)
  if (!user) redirect(`/${slug}/login`)

  return (
    <div className="flex min-h-screen">
      <Sidebar tenant={slug} role={user.role} />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  )
}
