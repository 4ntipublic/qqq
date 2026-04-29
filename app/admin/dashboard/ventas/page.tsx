import type { Metadata } from 'next'
import { fetchAdminSales } from '@/lib/admin-queries'
import { AdminSalesClient } from './_components/admin-sales-client'

export const metadata: Metadata = {
  title: 'Admin · Ventas',
}

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const sales = await fetchAdminSales()

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
          Stripe se concilia automáticamente vía webhook. Para ventas por
          transferencia o PayPal podés aprobar manualmente desde acá.
        </p>
      </header>

      <AdminSalesClient initialSales={sales} />
    </div>
  )
}
