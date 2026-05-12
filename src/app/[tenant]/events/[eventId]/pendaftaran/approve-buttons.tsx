'use client'
import { approveRegistration, rejectRegistration } from './actions'

export default function ApproveButtons({
  regId,
  tenant,
  eventId,
}: {
  regId: string
  tenant: string
  eventId: string
}) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        className="text-green-600 hover:text-green-800 text-xs font-medium"
        onClick={() => approveRegistration(regId, tenant, eventId)}
      >
        Lulus
      </button>
      <button
        className="text-red-500 hover:text-red-700 text-xs"
        onClick={() => rejectRegistration(regId, tenant, eventId)}
      >
        Tolak
      </button>
    </div>
  )
}
