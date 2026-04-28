'use client'

import type { ReactNode } from 'react'
import { CartProvider } from './CartContext'
import { ThemeProvider } from './ThemeContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  )
}
