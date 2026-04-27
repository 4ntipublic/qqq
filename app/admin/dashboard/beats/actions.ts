'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSsrClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type CreateBeatInput = {
  title: string
  bpm: number
  categoryId: string | null
  videoUrl: string | null
  audioUrl: string | null
  releaseDate: string | null // ISO string (UTC) or null
  isVisible: boolean
}

export type ActionResult = { ok: boolean; error?: string }

async function assertAdminSession(): Promise<ActionResult> {
  const ssr = await createSsrClient()
  const { data, error } = await ssr.auth.getUser()
  if (error || !data.user) {
    return { ok: false, error: 'Sesión expirada. Volvé a loguearte.' }
  }
  return { ok: true }
}

function validate(input: CreateBeatInput): string | null {
  if (!input.title?.trim()) return 'El título es requerido.'
  if (!Number.isFinite(input.bpm)) return 'BPM inválido.'
  if (input.bpm < 50 || input.bpm > 250) return 'BPM fuera de rango (50–250).'
  return null
}

export async function createBeatAction(input: CreateBeatInput): Promise<ActionResult> {
  const error = validate(input)
  if (error) return { ok: false, error }

  const auth = await assertAdminSession()
  if (!auth.ok) return auth

  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from('beats').insert({
    title: input.title.trim(),
    bpm: Math.round(input.bpm),
    category_id: input.categoryId ?? null,
    video_url: input.videoUrl?.trim() || null,
    audio_url: input.audioUrl?.trim() || null,
    release_date: input.releaseDate,
    is_visible: input.isVisible,
  })

  if (dbError) return { ok: false, error: dbError.message }

  revalidatePath('/admin/dashboard/beats')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}

export async function deleteBeatAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'ID inválido.' }

  const auth = await assertAdminSession()
  if (!auth.ok) return auth

  const supabase = createAdminClient()
  const { error } = await supabase.from('beats').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/dashboard/beats')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}
