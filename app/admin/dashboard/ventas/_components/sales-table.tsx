'use client'

import { useMemo, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatUsd, type Sale } from '@/lib/admin-data'

type BadgeVariant = 'default' | 'muted' | 'outline' | 'solid'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pagada: 'solid',
  paid: 'solid',
  pendiente: 'outline',
  pending: 'outline',
  cancelada: 'muted',
  cancelled: 'muted',
  canceled: 'muted',
  devolucion: 'muted',
  'devolución': 'muted',
  refund: 'muted',
  refunded: 'muted',
}

const variantFor = (status: string): BadgeVariant =>
  STATUS_VARIANT[status?.toLowerCase() ?? ''] ?? 'default'

const PAGE_SIZE = 8

interface SalesTableProps {
  initialSales: Sale[]
}

export function SalesTable({ initialSales }: SalesTableProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialSales.filter((sale) => {
      const matchesQuery =
        !q ||
        sale.invoiceId.toLowerCase().includes(q) ||
        sale.method.toLowerCase().includes(q) ||
        sale.status.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [initialSales, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    // Compact pagination: 1 … (p-1) p (p+1) … last
    const nums: Array<number | 'ellipsis'> = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) nums.push(i)
      return nums
    }
    nums.push(1)
    if (safePage > 3) nums.push('ellipsis')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      nums.push(i)
    }
    if (safePage < totalPages - 2) nums.push('ellipsis')
    nums.push(totalPages)
    return nums
  }, [totalPages, safePage])

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Registro de ventas</CardTitle>
          <CardDescription>
            {filtered.length} {filtered.length === 1 ? 'invoice' : 'invoices'} · página{' '}
            {safePage} de {totalPages}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por invoice, status o método…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pagada">Pagada</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
                <SelectItem value="Devolución">Devolución</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pageRows.length === 0 ? (
          <Empty
            icon={Receipt}
            title="No hay ventas para mostrar"
            description="Probá ajustar la búsqueda o el filtro de estado."
          />
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método de pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <span className="font-light text-foreground">{sale.invoiceId}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantFor(sale.status)}>{sale.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{sale.method}</span>
                    </TableCell>
                    <TableCell className="text-right font-light text-foreground">
                      {formatUsd(sale.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>
              {pageNumbers.map((n, idx) =>
                n === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={n}>
                    <PaginationLink
                      type="button"
                      isActive={n === safePage}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </CardContent>
    </Card>
  )
}
