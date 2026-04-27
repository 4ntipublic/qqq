import type { Metadata } from 'next'
import { fetchSales } from '@/lib/admin-queries'
import { SalesTable } from './_components/sales-table'

export const metadata: Metadata = {
  title: 'Admin · Ventas | akpkyy',
}

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const sales = await fetchSales()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Ventas
        </p>
        <h1 className="font-helvetica text-4xl font-light tracking-[-0.01em] text-foreground">
          Invoices y pagos
        </h1>
        <p className="text-sm font-light text-muted-foreground">
          Registro completo de invoices con estado, método de pago y monto.
        </p>
      </header>

      <SalesTable initialSales={sales} />
    </div>
  )
}
