import type { Metadata } from 'next'
import { DollarSign, FolderTree, Music2, ShoppingBag } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getAdminProfile } from '@/lib/auth'
import { fetchDashboardStats } from '@/lib/admin-queries'
import { formatUsd } from '@/lib/admin-data'
import { QuickActions } from './_components/quick-actions'
import { RevenueChart } from './_components/revenue-chart'
import { StatCard } from './_components/stat-card'
import { OrdersChart } from './_components/visits-chart'

export const metadata: Metadata = {
  title: 'Admin · Inicio | akpkyy',
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [profile, stats] = await Promise.all([getAdminProfile(), fetchDashboardStats()])

  const revenueData = stats.monthly.map((m) => ({ month: m.month, revenue: m.revenue }))
  const ordersData = stats.monthly.map((m) => ({ month: m.month, orders: m.orders }))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Inicio
        </p>
        <h1 className="font-helvetica text-4xl font-light tracking-[-0.01em] text-foreground">
          Bienvenido, {profile.displayName}
        </h1>
        <p className="text-sm font-light text-muted-foreground">
          Datos en vivo desde Supabase · agregados por mes del último año.
        </p>
      </header>

      <QuickActions />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Ventas mes"
          value={formatUsd(stats.salesMonthAmount)}
          icon={DollarSign}
        />
        <StatCard
          label="Invoices mes"
          value={stats.salesMonth.toLocaleString('en-US')}
          icon={ShoppingBag}
        />
        <StatCard
          label="Beats"
          value={stats.totalBeats.toLocaleString('en-US')}
          icon={Music2}
        />
        <StatCard
          label="Categorías"
          value={stats.totalCategories.toLocaleString('en-US')}
          icon={FolderTree}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas mensuales</CardTitle>
            <CardDescription>
              Ingresos en USD por mes (últimos 12 · status &quot;Pagada&quot;).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoices mensuales</CardTitle>
            <CardDescription>Volumen total de invoices por mes (últimos 12).</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            <OrdersChart data={ordersData} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
