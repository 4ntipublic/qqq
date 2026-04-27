import Link from 'next/link'
import { ArrowUpRight, Receipt, Tags, UploadCloud } from 'lucide-react'

const actions = [
  {
    label: 'Subir beat',
    description: 'Nuevo drop con BPM, tono y fecha programada.',
    href: '/admin/dashboard/beats',
    icon: UploadCloud,
  },
  {
    label: 'Nueva categoría',
    description: 'Añadir un género a la taxonomía.',
    href: '/admin/dashboard/categorias',
    icon: Tags,
  },
  {
    label: 'Ver ventas',
    description: 'Invoices recientes, pendientes y devoluciones.',
    href: '/admin/dashboard/ventas',
    icon: Receipt,
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map(({ label, description, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left shadow-sm transition-colors hover:bg-accent"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-light text-foreground">{label}</p>
            <p className="text-xs font-light text-muted-foreground">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
