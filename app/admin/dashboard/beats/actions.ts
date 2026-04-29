'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { assertAdmin } from '@/lib/admin-guard'
import { deleteR2Objects, extractR2Key } from '@/lib/r2'

export type CreateBeatInput = {
  title: string
  bpm: number
  key: string | null
  categoryId: string | null
  videoUrl: string | null
  audioUrl: string | null
  contractUrl: string | null
  releaseDate: string | null
  isVisible: boolean
  sizeMb: number | null
}

export type ActionResult = { ok: boolean; error?: string }

function validate(input: CreateBeatInput): string | null {
  if (!input.title?.trim()) return 'El título es requerido.'
  if (!Number.isFinite(input.bpm)) return 'BPM inválido.'
  if (input.bpm < 50 || input.bpm > 250) return 'BPM fuera de rango (50–250).'
  return null
}

export async function createBeatAction(input: CreateBeatInput): Promise<ActionResult> {
  const error = validate(input)
  if (error) return { ok: false, error }

  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from('beats').insert({
    title: input.title.trim(),
    bpm: Math.round(input.bpm),
    key: input.key?.trim() || null,
    category_id: input.categoryId ?? null,
    video_url: input.videoUrl?.trim() || null,
    audio_url: input.audioUrl?.trim() || null,
    contract_url: input.contractUrl?.trim() || null,
    release_date: input.releaseDate,
    is_visible: input.isVisible,
    size_mb:
      input.sizeMb !== null && Number.isFinite(input.sizeMb)
        ? Number(input.sizeMb.toFixed(2))
        : null,
  })

  if (dbError) return { ok: false, error: dbError.message }

  revalidatePath('/admin/dashboard/beats')
  revalidatePath('/admin/dashboard')
  revalidatePath('/beats')
  return { ok: true }
}

export async function deleteBeatAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'ID inválido.' }

  const auth = await assertAdmin()
  if (!auth.ok) return auth

  const supabase = createAdminClient()

  const { data: beatRow, error: fetchError } = await supabase
    .from('beats')
    .select('id, audio_url, video_url, contract_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!beatRow) return { ok: false, error: 'Beat no encontrado.' }

  const r2Keys = [
    extractR2Key(beatRow.audio_url as string | null),
    extractR2Key(beatRow.video_url as string | null),
    extractR2Key(beatRow.contract_url as string | null),
  ].filter((k): k is string => Boolean(k))

  if (r2Keys.length > 0) {
    try {
      await deleteR2Objects(r2Keys)
    } catch (cleanupErr) {
      console.error('[deleteBeatAction] R2 cleanup failed:', cleanupErr)
    }
  }

  const { error } = await supabase.from('beats').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/dashboard/beats')
  revalidatePath('/admin/dashboard')
  revalidatePath('/beats')
  return { ok: true }
}
