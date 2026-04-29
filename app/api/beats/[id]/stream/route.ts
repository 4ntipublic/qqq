import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createAdminClient } from '@/utils/supabase/admin'
import { R2_BUCKET, extractR2Key, r2Client } from '@/lib/r2'

// Audio streams need a server runtime (presigning) and never cache responses.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 15 minutes is plenty for preview playback + replays. Short enough that a
// leaked URL can't be redistributed long-term.
const STREAM_PRESIGN_EXPIRES_SECONDS = 60 * 15

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Anti-piracy proxy for beat audio. Front-end embeds /api/beats/{id}/stream
 * in <audio> tags so the canonical R2 key is never exposed. We resolve the
 * beat, presign a short-lived GET URL and 302 the browser to it.
 *
 * Switching the R2 bucket from public to private only requires CORS rules
 * on R2 (Access-Control-Allow-Origin → your domain); the response shape here
 * does not change.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select('id, audio_url, is_visible')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const row = data as { id: string; audio_url: string | null; is_visible: boolean }
  if (!row.is_visible) {
    return NextResponse.json({ error: 'unavailable' }, { status: 404 })
  }
  if (!row.audio_url) {
    return NextResponse.json({ error: 'no_audio' }, { status: 404 })
  }

  const key = extractR2Key(row.audio_url)
  if (!key) {
    // Audio is hosted externally (e.g. legacy pre-R2). Fall through to the
    // raw URL so playback keeps working — opaque to the client either way.
    return NextResponse.redirect(row.audio_url, 302)
  }

  try {
    const url = await getSignedUrl(
      r2Client,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn: STREAM_PRESIGN_EXPIRES_SECONDS }
    )
    const response = NextResponse.redirect(url, 302)
    // Hint to the browser/CDN: this redirect target is short-lived.
    response.headers.set(
      'Cache-Control',
      `private, max-age=${STREAM_PRESIGN_EXPIRES_SECONDS - 30}`
    )
    return response
  } catch (err) {
    console.error('[beats/stream] presign failed', id, err)
    return NextResponse.json({ error: 'sign_failed' }, { status: 500 })
  }
}
