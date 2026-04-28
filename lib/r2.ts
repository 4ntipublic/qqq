import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const endpoint = process.env.R2_ENDPOINT
const bucket = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL

if (!accessKeyId || !secretAccessKey || !endpoint || !bucket || !publicUrl) {
  throw new Error(
    'Missing R2 env vars. Required: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME, R2_PUBLIC_URL.',
  )
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
})

export const R2_BUCKET = bucket
export const R2_PUBLIC_URL = publicUrl.replace(/\/+$/, '')

export function buildR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key.replace(/^\/+/, '')}`
}

export function extractR2Key(url: string | null): string | null {
  if (!url) return null
  const prefix = `${R2_PUBLIC_URL}/`
  if (!url.startsWith(prefix)) return null
  const tail = url.slice(prefix.length)
  return tail.split('?')[0].split('#')[0] || null
}

export async function deleteR2Objects(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        }),
      ),
    ),
  )
}
