import type { ComponentType } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  delta?: {
    value: string
    trend: 'up' | 'down' | 'flat'
  }
  icon?: ComponentType<{ className?: string }>
}

export function StatCard({ label, value, delta, icon: Icon }: StatCardProps) {
  const TrendIcon =
    delta?.trend === 'up' ? TrendingUp : delta?.trend === 'down' ? TrendingDown : null
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        <p className="font-helvetica text-3xl font-light tracking-[-0.01em] text-foreground">
          {value}
        </p>
        {delta ? (
          <div
            className={cn(
              'inline-flex w-fit items-center gap-1 rounded-lg border border-border bg-background px-2 py-0.5 text-xs font-light',
              delta.trend === 'up' && 'text-foreground',
              delta.trend === 'down' && 'text-muted-foreground'
            )}
          >
            {TrendIcon ? <TrendIcon className="h-3 w-3" /> : null}
            <span>{delta.value}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
