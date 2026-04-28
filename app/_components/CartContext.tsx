'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { BeatCartPayload } from './BeatCard'

const STORAGE_KEY = 'akpkyy.cart.v1'

type CartContextValue = {
  items: BeatCartPayload[]
  addItem: (item: BeatCartPayload) => void
  removeItem: (index: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BeatCartPayload[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setItems(parsed as BeatCartPayload[])
        }
      }
    } catch {
      // localStorage unavailable / corrupt JSON — fall back to empty cart.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Quota exceeded or private mode — silently ignore.
    }
  }, [items, hydrated])

  const addItem = useCallback((item: BeatCartPayload) => {
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({ items, addItem, removeItem, clear }),
    [items, addItem, removeItem, clear]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider.')
  }
  return ctx
}
