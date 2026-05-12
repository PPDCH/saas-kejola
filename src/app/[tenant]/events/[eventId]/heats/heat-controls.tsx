'use client'
import { useState } from 'react'
import { generateHeats } from './actions'
import { Button } from '@/components/ui/button'

export default function HeatControls({
  acaraId,
  tenant,
  eventId,
  hasHeats,
}: {
  acaraId: string
  tenant: string
  eventId: string
  hasHeats: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={hasHeats ? 'outline' : 'default'}
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          setError('')
          const result = await generateHeats(acaraId, tenant, eventId)
          if (result?.error) setError(result.error)
          setLoading(false)
        }}
      >
        {loading ? 'Menjana...' : hasHeats ? '↻ Jana Semula' : 'Jana Heat'}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
