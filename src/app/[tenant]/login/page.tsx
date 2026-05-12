'use client'
import { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { use } from 'react'

export default function LoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Log Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              setLoading(true)
              const result = await login(formData, tenant)
              if (result?.error) {
                setError(result.error)
                setLoading(false)
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">Emel</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Kata Laluan</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Log Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
