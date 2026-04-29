import type { Metadata } from 'next'
import { Command } from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { AuthTabs } from './_components/auth-tabs'

export const metadata: Metadata = {
  title: 'Acceso',
  description: 'Iniciá sesión o creá tu cuenta en akpkyy.',
}

type PageProps = {
  searchParams: Promise<{ from?: string; tab?: string }>
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const from = typeof params.from === 'string' ? params.from : ''
  const initialTab = params.tab === 'signup' ? 'signup' : 'login'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb] px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]">
            <Command className="h-5 w-5 text-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-helvetica text-3xl font-light tracking-[-0.01em] text-foreground">
              akpkyy
            </h1>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              Tu cuenta · tu música
            </p>
          </div>
        </div>

        <Card className="border-none bg-white/70 backdrop-blur-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.18),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6">
            <AuthTabs from={from} initialTab={initialTab} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
