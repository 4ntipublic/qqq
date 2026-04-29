import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Library } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Compra confirmada',
}

type PageProps = {
  searchParams: Promise<{ invoice?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams
  const invoice = typeof params.invoice === 'string' ? params.invoice : null

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-20 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-helvetica text-4xl font-light tracking-[-0.01em] text-foreground sm:text-5xl">
          Gracias por tu compra
        </h1>
        <p className="max-w-md text-sm font-light text-muted-foreground">
          Recibimos tu orden y vamos a confirmar el pago en los próximos minutos. Cuando se acredite,
          vas a poder descargar los archivos en alta calidad desde tu biblioteca.
        </p>
      </div>

      {invoice ? (
        <div className="rounded-2xl bg-white/70 px-4 py-2.5 text-[12px] font-light text-muted-foreground shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl">
          Invoice <span className="font-mono font-medium text-foreground">#{invoice}</span>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/user/settings?tab=library"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800"
        >
          <Library className="h-4 w-4" strokeWidth={1.75} />
          Ir a mi biblioteca
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Seguir explorando
        </Link>
      </div>
    </div>
  )
}
