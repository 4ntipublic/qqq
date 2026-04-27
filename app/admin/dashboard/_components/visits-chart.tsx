'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const config = {
  orders: {
    label: 'Invoices',
    color: 'hsl(var(--foreground))',
  },
} satisfies ChartConfig

const numberFormatter = (value: number | string) =>
  typeof value === 'number' ? value.toLocaleString('en-US') : String(value)

interface OrdersChartProps {
  data: Array<{ month: string; orders: number }>
}

export function OrdersChart({ data }: OrdersChartProps) {
  return (
    <ChartContainer config={config} className="aspect-[16/9] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent formatter={numberFormatter} />}
          />
          <Bar
            dataKey="orders"
            fill="var(--color-orders)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
