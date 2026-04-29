'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { assertAdmin } from '@/lib/admin-guard'
import { slugify } from '@/lib/admin-data'

export type ActionResult = { ok: boolean; error?: string }

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const rawName = String(formData.get('name') ?? '').trim()
  if (!rawName) return { ok: false, error: 'Ingresá un nombre.' }

  const slug = slugify(rawName)
  if (!slug) return { ok: false, error: 'Nombre inválido.' }

  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()

  const { data: existing, error: checkError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (checkError) return { ok: false, error: checkError.message }
  if (existing) return { ok: false, error: 'Ya existe una categoría con ese nombre.' }

  const { error } = await supabase.from('categories').insert({ name: rawName, slug })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/dashboard/categorias')
  revalidatePath('/admin/dashboard/beats')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'ID inválido.' }

  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/dashboard/categorias')
  revalidatePath('/admin/dashboard/beats')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}
