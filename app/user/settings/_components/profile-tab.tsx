'use client'

import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, Trash2, User as UserIcon } from 'lucide-react'
import type { UserProfile } from '@/lib/user-queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { convertImageToWebp } from '@/lib/image-to-webp'
import {
  getAvatarUploadUrlAction,
  setAvatarUrlAction,
  updateProfileAction,
} from '../actions'
import { useToast } from './toast'

const MAX_AVATAR_BYTES = 25 * 1024 * 1024
const AVATAR_TARGET_PIXELS = 512

export function ProfileTab({ profile }: { profile: UserProfile }) {
  const toast = useToast()
  const [form, setForm] = useState({
    displayName: profile.displayName,
    instagram: profile.instagram,
    soundcloud: profile.soundcloud,
    spotify: profile.spotify,
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarProgress, setAvatarProgress] = useState(0)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const res = await updateProfileAction(form)
      if (res.ok) toast.push('Perfil actualizado.')
      else toast.push(res.error, 'error')
    })
  }

  const triggerFilePicker = () => fileInputRef.current?.click()

  const handleAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast.push('Tiene que ser una imagen.', 'error')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.push('Imagen demasiado grande (máx 25 MB).', 'error')
      return
    }

    setAvatarBusy(true)
    setAvatarProgress(0)

    try {
      // Client-side normalisation: centre-crop + resize to 512×512 WebP.
      const processed = await convertImageToWebp(file, {
        squareSize: AVATAR_TARGET_PIXELS,
        forceReencode: true,
      })

      const presign = await getAvatarUploadUrlAction({
        ext: 'webp',
        contentType: processed.type || 'image/webp',
      })
      if (!presign.ok || !presign.uploadUrl || !presign.publicUrl) {
        throw new Error(presign.error || 'No se pudo firmar el upload.')
      }

      await uploadWithProgress(presign.uploadUrl, processed, setAvatarProgress)

      const persist = await setAvatarUrlAction(presign.publicUrl)
      if (!persist.ok) throw new Error(persist.error)

      setAvatarUrl(presign.publicUrl)
      toast.push('Avatar actualizado.')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Falló la subida.', 'error')
    } finally {
      setAvatarBusy(false)
      setAvatarProgress(0)
    }
  }

  const handleRemoveAvatar = () => {
    if (!avatarUrl) return
    startTransition(async () => {
      const res = await setAvatarUrlAction(null)
      if (res.ok) {
        setAvatarUrl(null)
        toast.push('Avatar removido.')
      } else {
        toast.push(res.error, 'error')
      }
    })
  }

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar */}
      <section className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-black/[0.06] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Tu avatar"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UserIcon className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
          {avatarBusy ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[10px] tabular-nums">{avatarProgress}%</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-tight text-foreground">Foto de perfil</p>
          <p className="text-xs font-light text-muted-foreground">
            JPG, PNG o WEBP. Hasta 25 MB. La recortamos y la guardamos a 512×512 WebP automáticamente.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFilePicker}
              disabled={avatarBusy || isPending}
              className="gap-2"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
              {avatarUrl ? 'Cambiar' : 'Subir foto'}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={avatarBusy || isPending}
                className="gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Quitar
              </Button>
            ) : null}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelected}
        />
      </section>

      {/* Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="display_name"
            label="Nombre"
            value={form.displayName}
            onChange={(value) => updateField('displayName', value)}
            placeholder="Tu nombre artístico"
            required
            maxLength={80}
          />
          <Field
            id="instagram"
            label="Instagram"
            value={form.instagram}
            onChange={(value) => updateField('instagram', value)}
            placeholder="usuario"
            prefix="@"
            maxLength={64}
            optional
          />
          <Field
            id="soundcloud"
            label="SoundCloud"
            value={form.soundcloud}
            onChange={(value) => updateField('soundcloud', value)}
            placeholder="usuario"
            prefix="soundcloud.com/"
            maxLength={64}
            optional
          />
        </div>
        <Field
          id="spotify"
          label="Spotify"
          value={form.spotify}
          onChange={(value) => updateField('spotify', value)}
          placeholder="https://open.spotify.com/artist/…"
          maxLength={256}
          optional
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button type="submit" disabled={isPending} className="min-w-[120px] gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </motion.div>
        </div>
      </form>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  prefix,
  optional,
  required,
  maxLength,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  prefix?: string
  optional?: boolean
  required?: boolean
  maxLength?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-foreground/80">
        {label}{' '}
        {optional ? <span className="text-muted-foreground">(opcional)</span> : null}
      </Label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-light text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          autoComplete="off"
          className={prefix ? 'pl-[calc(0.75rem+var(--prefix-w,2.25rem))]' : ''}
          style={prefix ? ({ '--prefix-w': `${prefix.length * 0.55}rem` } as React.CSSProperties) : undefined}
        />
      </div>
    </div>
  )
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload falló (${xhr.status}).`))
    })
    xhr.addEventListener('error', () => reject(new Error('Error de red.')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado.')))
    xhr.send(file)
  })
}
