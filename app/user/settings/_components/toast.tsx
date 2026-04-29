'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

type ToastVariant = 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  push: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const appleSpring = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.9 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const push = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++counterRef.current
    setItems((prev) => [...prev, { id, message, variant }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2 sm:right-6 sm:top-6">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastRow key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastRow({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 2600)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  const Icon = item.variant === 'success' ? CheckCircle2 : AlertCircle
  const color = item.variant === 'success' ? 'text-emerald-600' : 'text-rose-600'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={appleSpring}
      className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white/85 p-3 shadow-[0_18px_50px_-16px_rgba(0,0,0,0.22),0_4px_14px_-4px_rgba(0,0,0,0.10)] backdrop-blur-2xl"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} strokeWidth={1.75} />
      <p className="flex-1 text-sm font-light text-foreground">{item.message}</p>
    </motion.div>
  )
}
