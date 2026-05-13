'use client'

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Ralat Pelayan</h2>
        <p className="text-sm text-red-600 font-mono break-all">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-red-400 mt-2">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Cuba Lagi
        </button>
      </div>
    </div>
  )
}
