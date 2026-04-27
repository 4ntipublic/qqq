'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

export function useChartContext(): ChartContextValue {
  const ctx = React.useContext(ChartContext)
  if (!ctx) {
    throw new Error('useChartContext must be used inside <ChartContainer>')
  }
  return ctx
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  className,
  children,
  style,
  ...rest
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    for (const [key, value] of Object.entries(config)) {
      if (value.color) {
        vars[`--color-${key}`] = value.color
      }
    }
    return vars
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn(
          'flex aspect-[2/1] w-full justify-center text-xs font-light text-foreground',
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
          '[&_.recharts-cartesian-grid_line]:stroke-border/60',
          '[&_.recharts-tooltip-cursor]:stroke-border',
          '[&_.recharts-surface]:outline-none',
          className
        )}
        style={{ ...cssVars, ...style } as React.CSSProperties}
        {...rest}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  label?: string | number
  payload?: Array<{
    name?: string
    value?: number | string
    dataKey?: string
    color?: string
    payload?: Record<string, unknown>
  }>
  formatter?: (value: number | string) => string
}

export function ChartTooltipContent({
  active,
  label,
  payload,
  formatter,
}: ChartTooltipContentProps) {
  const { config } = useChartContext()
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs font-light text-popover-foreground shadow-md">
      {label != null ? (
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((item, idx) => {
          const key = item.dataKey ?? item.name ?? String(idx)
          const conf = config[key]
          const display = conf?.label ?? item.name ?? key
          const colorVar = item.color ?? `var(--color-${key})`
          const raw = item.value
          const formatted =
            formatter && (typeof raw === 'number' || typeof raw === 'string')
              ? formatter(raw)
              : raw
          return (
            <div key={String(key) + idx} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colorVar }}
              />
              <span className="flex-1 text-muted-foreground">{display}</span>
              <span className="font-light text-foreground">{formatted}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type { ChartConfig }
