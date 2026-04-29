'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  updateEmailAction,
  updatePasswordAction,
  updatePhoneAction,
} from '../actions'
import { useToast } from './toast'

export function SecurityTab({
  currentEmail,
  currentPhone,
}: {
  currentEmail: string
  currentPhone: string
}) {
  return (
    <div className="flex flex-col gap-8">
      <PhoneCard initialPhone={currentPhone} />
      <EmailCard currentEmail={currentEmail} />
      <PasswordCard />
    </div>
  )
}

function PhoneCard({ initialPhone }: { initialPhone: string }) {
  const toast = useToast()
  const [phone, setPhone] = useState(initialPhone)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const res = await updatePhoneAction(phone)
      if (res.ok) toast.push('Teléfono actualizado.')
      else toast.push(res.error ?? 'No se pudo guardar.', 'error')
    })
  }

  const dirty = phone.trim() !== initialPhone.trim()

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Teléfono</h3>
        <p className="text-xs font-light text-muted-foreground">
          Tu número privado para contacto y recuperación de cuenta. Nunca se muestra públicamente.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="phone" className="text-foreground/80">
            Número
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+54 11 5555 1234"
              maxLength={32}
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={pending || !dirty} className="gap-2 sm:min-w-[140px]">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </form>
    </section>
  )
}

function EmailCard({ currentEmail }: { currentEmail: string }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const res = await updateEmailAction(email)
      if (res.ok) {
        toast.push('Te enviamos un link de confirmación al nuevo email.')
        setEmail('')
      } else {
        toast.push(res.error, 'error')
      }
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Email</h3>
        <p className="text-xs font-light text-muted-foreground">
          Tu email actual es <span className="font-medium text-foreground">{currentEmail}</span>.
          Para cambiarlo te enviaremos un link de confirmación.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="new-email" className="text-foreground/80">
            Nuevo email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nuevo@ejemplo.com"
              required
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={pending || !email} className="gap-2 sm:min-w-[140px]">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? 'Enviando…' : 'Cambiar email'}
        </Button>
      </form>
    </section>
  )
}

function PasswordCard() {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirm) {
      toast.push('Las contraseñas no coinciden.', 'error')
      return
    }
    startTransition(async () => {
      const res = await updatePasswordAction(password)
      if (res.ok) {
        toast.push('Contraseña actualizada.')
        setPassword('')
        setConfirm('')
      } else {
        toast.push(res.error, 'error')
      }
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Contraseña</h3>
        <p className="text-xs font-light text-muted-foreground">
          Mínimo 8 caracteres. Tu sesión actual seguirá activa.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password" className="text-foreground/80">
            Nueva contraseña
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="new-password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8"
              minLength={8}
              required
              className="pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password" className="text-foreground/80">
            Confirmar
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repetí la contraseña"
              minLength={8}
              required
              className="pl-9"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={pending} className="gap-2 sm:min-w-[180px]">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {pending ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </div>
      </form>
    </section>
  )
}
