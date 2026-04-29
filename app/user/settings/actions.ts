'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient as createSsrClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  R2_BUCKET,
  buildR2PublicUrl,
  deleteR2Objects,
  extractR2Key,
  r2Client,
} from '@/lib/r2'

export type ActionResult = { ok: boolean; error?: string }

export type GetAvatarUploadUrlResult = {
  ok: boolean
  uploadUrl?: string
  publicUrl?: string
  key?: string
  error?: string
}

const PRESIGN_EXPIRES_SECONDS = 60 * 5
const SAFE_EXT = /^[a-z0-9]{1,8}$/i
const ALLOWED_AVATAR_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

async function requireUser() {
  const supabase = await createSsrClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false as const, error: 'Sesión expirada. Volvé a loguearte.' }
  }
  return { ok: true as const, user: data.user, supabase }
}

// ---------- PROFILE ---------------------------------------------------------

export type UpdateProfileInput = {
  displayName: string
  instagram: string
  soundcloud: string
  spotify: string
}

const stripHandle = (raw: string): string =>
  raw.trim().replace(/^@+/, '').replace(/^https?:\/\/(www\.)?[^/]+\//i, '').replace(/\/$/, '')

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ActionResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const displayName = input.displayName.trim().slice(0, 80)
  if (!displayName) return { ok: false, error: 'El nombre es requerido.' }

  const payload = {
    display_name: displayName,
    instagram: stripHandle(input.instagram).slice(0, 64) || null,
    soundcloud: stripHandle(input.soundcloud).slice(0, 64) || null,
    spotify: input.spotify.trim().slice(0, 256) || null,
  }

  const { error } = await ctx.supabase
    .from('user_profiles')
    .update(payload)
    .eq('id', ctx.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/user/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

/**
 * Update only the user's phone number. Phone lives in the Security tab because
 * it's a private contact detail (not part of the public-facing profile).
 */
export async function updatePhoneAction(rawPhone: string): Promise<ActionResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const trimmed = rawPhone.trim().slice(0, 32)

  const { error } = await ctx.supabase
    .from('user_profiles')
    .update({ phone: trimmed || null })
    .eq('id', ctx.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/user/settings')
  return { ok: true }
}

// ---------- AVATAR ----------------------------------------------------------

export type GetAvatarUploadUrlInput = {
  ext: string
  contentType: string
}

export async function getAvatarUploadUrlAction(
  input: GetAvatarUploadUrlInput
): Promise<GetAvatarUploadUrlResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const cleanExt = input.ext.trim().replace(/^\./, '').toLowerCase()
  if (!cleanExt || !SAFE_EXT.test(cleanExt) || !ALLOWED_AVATAR_EXTS.has(cleanExt)) {
    return { ok: false, error: 'Formato de imagen no permitido.' }
  }
  if (!input.contentType.startsWith('image/') || input.contentType.length > 64) {
    return { ok: false, error: 'Content-Type inválido.' }
  }

  const key = `avatars/${ctx.user.id}/${randomUUID()}.${cleanExt}`

  try {
    const uploadUrl = await getSignedUrl(
      r2Client,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: input.contentType,
      }),
      { expiresIn: PRESIGN_EXPIRES_SECONDS }
    )
    return { ok: true, uploadUrl, publicUrl: buildR2PublicUrl(key), key }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Falló la firma del upload.',
    }
  }
}

export async function setAvatarUrlAction(
  newUrl: string | null
): Promise<ActionResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  if (newUrl !== null) {
    if (typeof newUrl !== 'string' || newUrl.length > 1024) {
      return { ok: false, error: 'URL inválida.' }
    }
    if (!extractR2Key(newUrl)) {
      return { ok: false, error: 'La imagen debe estar alojada en nuestro CDN.' }
    }
  }

  // Cleanup the previous avatar from R2 (best-effort).
  const { data: existing } = await ctx.supabase
    .from('user_profiles')
    .select('avatar_url')
    .eq('id', ctx.user.id)
    .maybeSingle()

  const previousKey = extractR2Key((existing?.avatar_url as string | null) ?? null)
  if (previousKey && previousKey !== extractR2Key(newUrl)) {
    try {
      await deleteR2Objects([previousKey])
    } catch (err) {
      console.error('[setAvatarUrlAction] cleanup failed', err)
    }
  }

  const { error } = await ctx.supabase
    .from('user_profiles')
    .update({ avatar_url: newUrl })
    .eq('id', ctx.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/user/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------- SECURITY --------------------------------------------------------

export async function updateEmailAction(newEmail: string): Promise<ActionResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const trimmed = newEmail.trim()
  if (!trimmed.includes('@') || trimmed.length > 254) {
    return { ok: false, error: 'Email inválido.' }
  }

  const { error } = await ctx.supabase.auth.updateUser({ email: trimmed })
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

// ---------- SECURE BEAT DOWNLOAD --------------------------------------------

const DOWNLOAD_PRESIGN_EXPIRES_SECONDS = 60 * 5

export type GetDownloadUrlResult = {
  ok: boolean
  url?: string
  filename?: string
  expiresInSeconds?: number
  error?: string
}

export type DownloadAssetType = 'audio' | 'contract'

const sanitiseTitle = (raw: string): string => {
  const cleaned = (raw || 'beat')
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return cleaned || 'beat'
}

/**
 * Returns a short-lived presigned GET URL for an asset attached to a paid sale.
 * `type` selects between the audio file (`audio_url`) and the licence contract
 * (`contract_url`). Ownership and 'Pagada' status are enforced for both.
 */
export async function getBeatDownloadUrlAction(
  saleId: string,
  type: DownloadAssetType = 'audio'
): Promise<GetDownloadUrlResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  if (typeof saleId !== 'string' || saleId.length < 8 || saleId.length > 64) {
    return { ok: false, error: 'ID de compra inválido.' }
  }
  if (type !== 'audio' && type !== 'contract') {
    return { ok: false, error: 'Tipo de descarga inválido.' }
  }

  // Use the admin client for the join; ownership is enforced manually below.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sales')
    .select(
      'id, status, user_id, buyer_email, beat_id, beats(title, audio_url, contract_url)'
    )
    .eq('id', saleId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Compra no encontrada.' }

  type Beat = {
    title: string
    audio_url: string | null
    contract_url: string | null
  }
  type SaleRow = {
    id: string
    status: string
    user_id: string | null
    buyer_email: string | null
    beat_id: string | null
    beats: Beat | Beat[] | null
  }
  const row = data as SaleRow

  // Ownership: prefer the explicit user_id link; fall back to buyer_email match
  // for legacy sales recorded before user_id was wired in.
  const ownsByUserId = row.user_id === ctx.user.id
  const ownsByEmail =
    !row.user_id && Boolean(row.buyer_email) && row.buyer_email === ctx.user.email
  if (!ownsByUserId && !ownsByEmail) {
    return { ok: false, error: 'Esta compra no está vinculada a tu cuenta.' }
  }

  if (row.status !== 'Pagada') {
    return {
      ok: false,
      error: 'Vamos a habilitar la descarga apenas se acredite el pago.',
    }
  }

  const beat = Array.isArray(row.beats) ? row.beats[0] : row.beats
  if (!beat) {
    return { ok: false, error: 'No hay archivo asociado a este beat.' }
  }

  const sourceUrl = type === 'contract' ? beat.contract_url : beat.audio_url
  if (!sourceUrl) {
    return {
      ok: false,
      error:
        type === 'contract'
          ? 'Este beat no tiene contrato adjunto todavía.'
          : 'No hay audio asociado a este beat.',
    }
  }

  const key = extractR2Key(sourceUrl)
  if (!key) {
    return { ok: false, error: 'El archivo no está alojado en nuestro CDN.' }
  }

  const titleSlug = sanitiseTitle(beat.title)
  const rawExt = (key.split('.').pop() || (type === 'audio' ? 'mp3' : 'pdf'))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const ext = rawExt || (type === 'audio' ? 'mp3' : 'pdf')
  const filename =
    type === 'contract'
      ? `Contrato - ${titleSlug}.${ext}`
      : `${titleSlug}.${ext}`

  try {
    const url = await getSignedUrl(
      r2Client,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      }),
      { expiresIn: DOWNLOAD_PRESIGN_EXPIRES_SECONDS }
    )
    return {
      ok: true,
      url,
      filename,
      expiresInSeconds: DOWNLOAD_PRESIGN_EXPIRES_SECONDS,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'No se pudo firmar la descarga.',
    }
  }
}

// ---------- PASSWORD --------------------------------------------------------

export async function updatePasswordAction(
  newPassword: string
): Promise<ActionResult> {
  const ctx = await requireUser()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (newPassword.length > 128) {
    return { ok: false, error: 'Contraseña demasiado larga.' }
  }

  const { error } = await ctx.supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}
