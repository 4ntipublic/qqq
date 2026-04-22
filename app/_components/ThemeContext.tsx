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
  waterSpeed: number
  waterDepth: number
  waterClarity: number
  waterWaves: number
  waterReflection: number
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
  setWaterSpeed: (nextValue: number) => void
  setWaterDepth: (nextValue: number) => void
  setWaterClarity: (nextValue: number) => void
  setWaterWaves: (nextValue: number) => void
  setWaterReflection: (nextValue: number) => void
  resetTheme: () => void
}

export const defaultTheme: ThemeState = {
  boxColor: '#f0ead6',
  accentColor: '#fef08a',
  textColor: '#f8fafc',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  expandedOverlayColor: '#2B3A42',
  overlayOpacity: 0.85,
  boxBlur: 20,
  boxOpacity: 4,
  boxShadowOpacity: 30,
  waterSpeed: 1,
  waterDepth: 1,
  waterClarity: 1,
  waterWaves: 1,
  waterReflection: 1,
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
      setWaterSpeed: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          waterSpeed: clamp(nextValue, 0.1, 3),
        })),
      setWaterDepth: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          waterDepth: clamp(nextValue, 0, 2),
        })),
      setWaterClarity: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          waterClarity: clamp(nextValue, 0, 2),
        })),
      setWaterWaves: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          waterWaves: clamp(nextValue, 0.2, 3),
        })),
      setWaterReflection: (nextValue: number) =>
        setTheme((currentTheme) => ({
          ...currentTheme,
          waterReflection: clamp(nextValue, 0, 2),
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
