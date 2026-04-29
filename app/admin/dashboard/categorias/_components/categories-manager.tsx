'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Tags, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/lib/admin-data'
import { createCategoryAction, deleteCategoryAction } from '../actions'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

interface CategoriesManagerProps {
  initialCategories: Category[]
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAdd = (rawName: string) => {
    const name = rawName.trim()
    if (!name) {
      setError('Ingresá un nombre.')
      return
    }
    const formData = new FormData()
    formData.set('name', name)
    startTransition(async () => {
      const result = await createCategoryAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo crear la categoría.')
        return
      }
      setNewName('')
      setError(null)
    })
  }

  const handleRemove = (id: string) => {
    setPendingId(id)
    startTransition(async () => {
      const result = await deleteCategoryAction(id)
      setPendingId(null)
      if (!result.ok) setError(result.error ?? 'No se pudo eliminar la categoría.')
    })
  }

  const categories = initialCategories

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nueva categoría</CardTitle>
          <CardDescription>
            Agregá un género a la taxonomía del catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              value={newName}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(event) => {
                setNewName(event.target.value)
                setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAdd(newName)
                }
              }}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-light text-foreground"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            onClick={() => handleAdd(newName)}
            disabled={isPending}
            className="w-full"
          >
            {isPending && !pendingId ? (
              <>
                <Loader2 className="animate-spin" />
                Creando…
              </>
            ) : (
              <>
                <Plus />
                Crear categoría
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías activas</CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? 'género' : 'géneros'} disponibles
            en el catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <Empty
              icon={Tags}
              title="No hay categorías todavía"
              description="Creá tu primera categoría desde el panel de la izquierda."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-light text-foreground">
                        {category.name}
                      </span>
                      <Badge variant="muted">/{category.slug}</Badge>
                    </div>
                    <span className="text-xs font-light text-muted-foreground">
                      Creada {formatDate(category.createdAt)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${category.name}`}
                    disabled={pendingId === category.id}
                    onClick={() => handleRemove(category.id)}
                  >
                    {pendingId === category.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
