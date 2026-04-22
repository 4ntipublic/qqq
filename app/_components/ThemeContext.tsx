'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export type ThemeState = {
  boxColor: string
  accentColor: string
  textColor: string
  fontFamily: string
  fontWeight: number
  expandedOverlayColor: string
  overlayOpacity: number
  boxBlur: number
  boxOpacity: number
  boxShadowOpacity: number
}

type ThemeContextValue = {
  theme: ThemeState
  setBoxColor: (nextColor: string) => void
  setAccentColor: (nextColor: string) => void
  setTextColor: (nextColor: string) => void
  setFontFamily: (nextFontFamily: string) => void
  setFontWeight: (nextWeight: number) => void
  setExpandedOverlayColor: (nextColor: string) => void
  setOverlayOpacity: (nextValue: number) => void
  setBoxBlur: (nextValue: number) => void
  setBoxOpacity: (nextValue: number) => void
  setBoxShadowOpacity: (nextValue: number) => void
  resetTheme: () => void
}

export const defaultTheme: ThemeState = {
  boxColor: '#f3f4f6',
  accentColor: '#d4d4d8',
  textColor: '#111827',
  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
  fontWeight: 300,
  expandedOverlayColor: '#2B3A42',
  overlayOpacity: 0.85,
  boxBlur: 20,
  boxOpacity: 4,
  boxShadowOpacity: 30,
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(defaultTheme)

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setBoxColor: (nextColor: string) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          boxColor: nextColor,
        })),
      setAccentColor: (nextColor: string) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          accentColor: nextColor,
        })),
      setTextColor: (nextColor: string) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          textColor: nextColor,
        })),
      setFontFamily: (nextFontFamily: string) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          fontFamily: nextFontFamily,
        })),
      setFontWeight: (nextWeight: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          fontWeight: Math.round(clamp(nextWeight, 100, 900) / 100) * 100,
        })),
      setExpandedOverlayColor: (nextColor: string) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          expandedOverlayColor: nextColor,
        })),
      setOverlayOpacity: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          overlayOpacity: nextValue,
        })),
      setBoxBlur: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          boxBlur: nextValue,
        })),
      setBoxOpacity: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          boxOpacity: nextValue,
        })),
      setBoxShadowOpacity: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          boxShadowOpacity: nextValue,
        })),
      resetTheme: () => setTheme(defaultTheme),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeCustomizer(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeCustomizer must be used within ThemeProvider.')
  }

  return context
}
