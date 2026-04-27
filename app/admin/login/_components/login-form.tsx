'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction, type LoginState } from '../actions'

const initialState: LoginState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full h-11" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Verificando…
        </>
      ) : (
        <>
          <ShieldCheck />
          Entrar
        </>
      )}
    </Button>
  )
}

export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="from" value={from} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="text-foreground/80">
          Usuario
        </Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="pible…"
            required
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-foreground/80">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-border bg-muted px-3 py-2 text-sm font-light text-foreground"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-xs font-light text-muted-foreground text-center">
        Function over Form · Acceso restringido
      </p>
    </form>
  )
}
