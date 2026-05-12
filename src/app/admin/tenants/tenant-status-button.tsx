'use client'
import { useState } from 'react'
import { updateTenantStatus } from './actions'
import { Button } from '@/components/ui/button'

export default function TenantStatusButton({
  tenantId,
  currentStatus,
}: {
  tenantId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState(false)
  const isActive = currentStatus === 'ACTIVE'

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      className={isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}
      onClick={async () => {
        setLoading(true)
        await updateTenantStatus(tenantId, isActive ? 'SUSPENDED' : 'ACTIVE')
        setLoading(false)
      }}
    >
      {loading ? '...' : isActive ? 'Gantung' : 'Aktifkan'}
    </Button>
  )
}
