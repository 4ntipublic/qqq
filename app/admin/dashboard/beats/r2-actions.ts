'use server'

import { randomUUID } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient as createSsrClient } from '@/utils/supabase/server'
import { R2_BUCKET, buildR2PublicUrl, r2Client } from '@/lib/r2'

const ALLOWED_FOLDERS = new Set(['audio', 'video', 'image'])
const SAFE_EXT = /^[a-z0-9]{1,8}$/i
const PRESIGN_EXPIRES_SECONDS = 60 * 5

export type R2UploadFolder = 'audio' | 'video' | 'image'

export type GetR2UploadUrlInput = {
  folder: R2UploadFolder
  contentType: string
  ext: string
}

export type GetR2UploadUrlResult = {
  ok: boolean
  uploadUrl?: string
  publicUrl?: string
  key?: string
  error?: string
}

export async function getR2UploadUrl(
  input: GetR2UploadUrlInput,
): Promise<GetR2UploadUrlResult> {
  if (!ALLOWED_FOLDERS.has(input.folder)) {
    return { ok: false, error: 'Carpeta no permitida.' }
  }
  const cleanExt = input.ext.trim().replace(/^\./, '').toLowerCase()
  if (!cleanExt || !SAFE_EXT.test(cleanExt)) {
    return { ok: false, error: 'Extensión inválida.' }
  }
  if (!input.contentType || input.contentType.length > 128) {
    return { ok: false, error: 'Content-Type inválido.' }
  }

  const ssr = await createSsrClient()
  const { data, error } = await ssr.auth.getUser()
  if (error || !data.user) {
    return { ok: false, error: 'Sesión expirada. Volvé a loguearte.' }
  }

  const key = `${input.folder}/${randomUUID()}.${cleanExt}`

  try {
    const uploadUrl = await getSignedUrl(
      r2Client,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: input.contentType,
      }),
      { expiresIn: PRESIGN_EXPIRES_SECONDS },
    )

    return {
      ok: true,
      uploadUrl,
      publicUrl: buildR2PublicUrl(key),
      key,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Falló la firma del upload.',
    }
  }
}
