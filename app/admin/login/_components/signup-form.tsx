'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signupAction, type SignupState } from '../actions'

const initialState: SignupState = { error: null, pendingEmail: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Creando cuenta…
        </>
      ) : (
        <>
          <UserPlus />
          Crear cuenta
        </>
      )}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  if (state.pendingEmail) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="[font-family:var(--font-title)] text-lg font-semibold tracking-tight text-foreground">
            Revisá tu correo
          </h3>
          <p className="text-sm font-light text-muted-foreground">
            Te enviamos un link de confirmación a
            <br />
            <span className="font-medium text-foreground">{state.pendingEmail}</span>
          </p>
        </div>
        <p className="text-xs font-light text-muted-foreground">
          Hacé clic en el link para activar tu cuenta y entrar.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-display-name" className="text-foreground/80">
          Nombre <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-display-name"
            name="display_name"
            autoComplete="name"
            placeholder="Tu nombre"
            className="pl-9"
            maxLength={80}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email" className="text-foreground/80">
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vos@ejemplo.com"
            required
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password" className="text-foreground/80">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
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

      <p className="text-center text-xs font-light text-muted-foreground">
        Al crear una cuenta aceptás los términos · akpkyy
      </p>
    </form>
  )
}
