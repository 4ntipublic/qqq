'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Music2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
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
import type { Beat, Category } from '@/lib/admin-data'

const PAGE_SIZE = 6

interface BeatsListProps {
  beats: Beat[]
  categories: Category[]
}

function getBeatBadge(beat: Beat): {
  label: string
  variant: 'default' | 'muted' | 'outline' | 'solid'
} {
  if (beat.isVisible) return { label: 'Publicado', variant: 'solid' }
  if (beat.releaseDate && new Date(beat.releaseDate).getTime() > Date.now()) {
    return { label: 'Programado', variant: 'outline' }
  }
  return { label: 'Borrador', variant: 'muted' }
}

export function BeatsList({ beats, categories }: BeatsListProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>()
    for (const cat of categories) map.set(cat.id, cat)
    return map
  }, [categories])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return beats
    return beats.filter((beat) => {
      const catName = beat.categoryId
        ? categoryById.get(beat.categoryId)?.name.toLowerCase() ?? ''
        : ''
      return (
        beat.title.toLowerCase().includes(q) ||
        catName.includes(q) ||
        String(beat.bpm).includes(q)
      )
    })
  }, [beats, categoryById, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Catálogo de beats</CardTitle>
          <CardDescription>
            {filtered.length} {filtered.length === 1 ? 'beat' : 'beats'} · página{' '}
            {safePage} de {totalPages}
          </CardDescription>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, BPM o género…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pageRows.length === 0 ? (
          <Empty
            icon={Music2}
            title={beats.length === 0 ? 'No hay beats aún' : 'Sin resultados'}
            description={
              beats.length === 0
                ? 'Subí tu primer beat desde el formulario.'
                : 'Probá con otro término de búsqueda.'
            }
          />
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>BPM</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Drop</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((beat) => {
                  const category = beat.categoryId
                    ? categoryById.get(beat.categoryId)
                    : null
                  const badge = getBeatBadge(beat)
                  return (
                    <TableRow key={beat.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-light text-foreground">{beat.title}</span>
                          {beat.audioUrl ? (
                            <span className="truncate text-xs font-light text-muted-foreground">
                              {beat.audioUrl}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-helvetica text-base font-light">
                        {beat.bpm}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {category ? category.name : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {beat.releaseDate
                          ? format(new Date(beat.releaseDate), 'PP', { locale: es })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <PaginationItem key={n}>
                  <PaginationLink
                    type="button"
                    isActive={n === safePage}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
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
