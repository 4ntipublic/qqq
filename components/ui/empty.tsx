import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyProps {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function Empty({ icon: Icon, title, description, action, className }: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center',
        className
      )}
    >
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-light text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-xs font-light text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
