import type { Metadata } from 'next'
import { Command } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from './_components/login-form'

export const metadata: Metadata = {
  title: 'Admin · Login | akpkyy',
  description: 'Acceso restringido al panel de administración akpkyy.',
}

type PageProps = {
  searchParams: Promise<{ from?: string }>
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const from = typeof params.from === 'string' ? params.from : '/admin/dashboard'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb] px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
            <Command className="h-5 w-5 text-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-helvetica text-3xl font-light tracking-[-0.01em] text-foreground">
              akpkyy
            </h1>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              Panel de administración
            </p>
          </div>
        </div>

        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para continuar al dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm from={from} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
