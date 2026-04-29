'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { assertAdmin } from '@/lib/admin-guard'

export type ActionResult = { ok: boolean; error?: string }

export type FeaturedFormat = 'grid' | 'list'

const ALLOWED_FORMATS: ReadonlyArray<FeaturedFormat> = ['grid', 'list']

function revalidate() {
  revalidatePath('/admin/dashboard/featured')
  revalidatePath('/', 'layout')
}

/**
 * Toggle is_featured for a beat.
 * When turning ON, append to the end of the featured order (max + 1).
 * When turning OFF, clear featured_order.
 */
export async function toggleFeaturedAction(
  beatId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  if (!beatId) return { ok: false, error: 'ID inválido.' }
  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()

  if (isFeatured) {
    const { data: maxRow } = await supabase
      .from('beats')
      .select('featured_order')
      .eq('is_featured', true)
      .not('featured_order', 'is', null)
      .order('featured_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder =
      typeof maxRow?.featured_order === 'number' ? maxRow.featured_order + 1 : 0

    const { error } = await supabase
      .from('beats')
      .update({ is_featured: true, featured_order: nextOrder })
      .eq('id', beatId)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('beats')
      .update({ is_featured: false, featured_order: null })
      .eq('id', beatId)

    if (error) return { ok: false, error: error.message }
  }

  revalidate()
  return { ok: true }
}

export async function setFeaturedFormatAction(
  beatId: string,
  format: FeaturedFormat
): Promise<ActionResult> {
  if (!beatId) return { ok: false, error: 'ID inválido.' }
  if (!ALLOWED_FORMATS.includes(format)) {
    return { ok: false, error: 'Formato inválido.' }
  }

  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('beats')
    .update({ featured_format: format })
    .eq('id', beatId)

  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

/**
 * Bulk reorder featured beats. `orderedIds` represents the desired display order.
 * Each id in the array gets featured_order = its index.
 */
export async function reorderFeaturedAction(
  orderedIds: string[]
): Promise<ActionResult> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: 'Lista vacía.' }
  }
  if (orderedIds.some((id) => typeof id !== 'string' || !id)) {
    return { ok: false, error: 'IDs inválidos.' }
  }

  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('beats').update({ featured_order: index }).eq('id', id)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }

  revalidate()
  return { ok: true }
}
