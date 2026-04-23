'use client'

import { useState, type CSSProperties } from 'react'
import { defaultTheme, useThemeCustomizer, type ThemeState } from './ThemeContext'
import { rgbaFromHex } from './themeColor'

const rangeClassName =
  'mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.14)] outline-none transition hover:bg-[rgba(255,255,255,0.22)] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:bg-white'

// Monochromatic palette. Blindada a blancos, grises y negros para preservar
// la filosofia 'Function over Form'. Orden de claro -> oscuro.
const MONO_PALETTE = [
  '#ffffff',
  '#f3f4f6',
  '#d4d4d8',
  '#9ca3af',
  '#6b7280',
  '#374151',
  '#111827',
  '#000000',
] as const

type SectionTitleProps = {
  title: string
  color: string
}

function SectionTitle({ title, color }: SectionTitleProps) {
  return (
    <p className="[font-family:var(--font-body)] text-[0.68rem] font-semibold tracking-[0.16em]" style={{ color }}>
      {title}
    </p>
  )
}

type MonoSwatchPickerProps = {
  value: string
  onSelect: (hex: string) => void
  ariaLabel: string
}

function MonoSwatchPicker({ value, onSelect, ariaLabel }: MonoSwatchPickerProps) {
  const normalized = value.toLowerCase()
  return (
    <div className="mt-2 flex items-center justify-between gap-1" role="radiogroup" aria-label={ariaLabel}>
      {MONO_PALETTE.map((hex) => {
        const isSelected = hex.toLowerCase() === normalized
        return (
          <button
            type="button"
            key={hex}
            role="radio"
            aria-checked={isSelected}
            aria-label={hex}
            onClick={() => onSelect(hex)}
            className={`h-5 w-5 rounded-full border transition ${
              isSelected
                ? 'border-white ring-2 ring-white/70 ring-offset-1 ring-offset-black/40'
                : 'border-white/30 hover:border-white/60'
            }`}
            style={{ backgroundColor: hex }}
          />
        )
      })}
    </div>
  )
}

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    theme,
    setBoxColor,
    setAccentColor,
    setTextColor,
    setFontFamily,
    setFontWeight,
    setExpandedOverlayColor,
    setOverlayOpacity,
    setBoxBlur,
    setBoxOpacity,
    setBoxShadowOpacity,
    resetTheme,
  } = useThemeCustomizer()

  const [draftTheme, setDraftTheme] = useState<ThemeState>(theme)

  const updateDraftTheme = <K extends keyof ThemeState>(key: K, value: ThemeState[K]) => {
    setDraftTheme((currentTheme) => ({
      ...currentTheme,
      [key]: value,
    }))
  }

  const applyColorChanges = () => {
    setBoxColor(draftTheme.boxColor)
    setAccentColor(draftTheme.accentColor)
    setTextColor(draftTheme.textColor)
    setExpandedOverlayColor(draftTheme.expandedOverlayColor)
    setOverlayOpacity(draftTheme.overlayOpacity)
  }

  const applyMaterialChanges = () => {
    setBoxBlur(draftTheme.boxBlur)
    setBoxOpacity(draftTheme.boxOpacity)
    setBoxShadowOpacity(draftTheme.boxShadowOpacity)
  }

  const applyTypographyChanges = () => {
    setFontFamily(draftTheme.fontFamily)
    setFontWeight(draftTheme.fontWeight)
  }

  const handleResetTheme = () => {
    resetTheme()
    setDraftTheme({ ...defaultTheme })
  }

  const panelTextColor = rgbaFromHex(draftTheme.textColor, 0.92)
  const panelMutedTextColor = rgbaFromHex(draftTheme.textColor, 0.66)
  const panelBorderColor = rgbaFromHex(draftTheme.accentColor, 0.3)
  const boxTint = `${draftTheme.boxColor}${Math.round((draftTheme.boxOpacity / 100) * 255)
    .toString(16)
    .padStart(2, '0')}`
  const panelGlass = `blur(${Math.max(16, draftTheme.boxBlur)}px) saturate(180%)`

  const triggerStyle: CSSProperties = {
    background: boxTint,
    borderColor: rgbaFromHex(draftTheme.accentColor, 0.42),
    color: panelTextColor,
    backdropFilter: panelGlass,
    WebkitBackdropFilter: panelGlass,
    boxShadow: `0 8px 32px 0 rgba(0,0,0,${draftTheme.boxShadowOpacity / 100})`,
  }

  const panelStyle: CSSProperties = {
    background: boxTint,
    borderColor: panelBorderColor,
    backdropFilter: panelGlass,
    WebkitBackdropFilter: panelGlass,
    boxShadow: `0 12px 36px rgba(0,0,0,${Math.max(0.25, draftTheme.boxShadowOpacity / 100)})`,
  }

  const sectionCardStyle: CSSProperties = {
    backgroundColor: rgbaFromHex(draftTheme.boxColor, Math.min(0.24, draftTheme.boxOpacity / 100 + 0.06)),
    borderColor: rgbaFromHex(draftTheme.accentColor, 0.2),
  }

  const inputColorStyle: CSSProperties = {
    borderColor: rgbaFromHex(draftTheme.textColor, 0.2),
    backgroundColor: rgbaFromHex(draftTheme.boxColor, 0.16),
  }

  const sectionTitleColor = rgbaFromHex(draftTheme.accentColor, 0.86)

  const sliderStyle: CSSProperties = {
    accentColor: draftTheme.accentColor,
  }

  const overlayOpacityPercent = draftTheme.overlayOpacity <= 1 ? draftTheme.overlayOpacity * 100 : draftTheme.overlayOpacity

  const applyButtonStyle: CSSProperties = {
    borderColor: rgbaFromHex(draftTheme.accentColor, 0.34),
    color: panelTextColor,
    background: `linear-gradient(140deg, ${rgbaFromHex(draftTheme.boxColor, Math.min(0.32, draftTheme.boxOpacity / 100 + 0.1))} 0%, rgba(255,255,255,0.14) 100%)`,
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    boxShadow: `0 10px 24px rgba(0,0,0,${Math.max(0.18, draftTheme.boxShadowOpacity / 100 - 0.1)})`,
  }

  return (
    <div className="fixed right-6 top-24 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() =>
          setIsOpen((open) => {
            const nextOpen = !open

            if (nextOpen) {
              setDraftTheme({ ...theme })
            }

            return nextOpen
          })
        }
        className="flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-[20px] backdrop-saturate-[180%] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-[1.03]"
        style={triggerStyle}
        aria-label="Abrir personalizador de tema"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9.6 2.3h4.8l.7 2.5 2.3 1.3 2.5-.8 2.4 4.2-1.8 1.9v2.6l1.8 1.9-2.4 4.2-2.5-.8-2.3 1.3-.7 2.5H9.6l-.7-2.5-2.3-1.3-2.5.8-2.4-4.2 1.8-1.9v-2.6L1.7 9.5l2.4-4.2 2.5.8 2.3-1.3z" />
          <circle cx="12" cy="12" r="3.1" />
        </svg>
      </button>

      {isOpen ? (
        <aside
          className="custom-scrollbar max-h-[85vh] w-[320px] overflow-y-auto overscroll-contain rounded-[24px] border p-4 pr-2 shadow-[0_12px_36px_rgba(0,0,0,0.32)]"
          style={panelStyle}
          onWheel={(event) => event.stopPropagation()}
        >
          <p className="[font-family:var(--font-title)] text-[1.08rem] font-bold" style={{ color: panelTextColor }}>
            Theme Customizer
          </p>

          <div className="mt-4 space-y-3">
            <section className="rounded-2xl border p-3" style={sectionCardStyle}>
              <SectionTitle title="[ COLORES ]" color={sectionTitleColor} />

              <div className="mt-3 space-y-2.5">
                <div className="block rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2">
                  <span className="[font-family:var(--font-body)] text-[0.75rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                    Color Tarjetas
                  </span>
                  <MonoSwatchPicker
                    value={draftTheme.boxColor}
                    onSelect={(hex) => updateDraftTheme('boxColor', hex)}
                    ariaLabel="Color del tinte de tarjetas"
                  />
                </div>

                <div className="block rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2">
                  <span className="[font-family:var(--font-body)] text-[0.75rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                    Color de Acentos
                  </span>
                  <MonoSwatchPicker
                    value={draftTheme.accentColor}
                    onSelect={(hex) => updateDraftTheme('accentColor', hex)}
                    ariaLabel="Color de acentos"
                  />
                </div>

                <div className="block rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2">
                  <span className="[font-family:var(--font-body)] text-[0.75rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                    Color de Textos
                  </span>
                  <MonoSwatchPicker
                    value={draftTheme.textColor}
                    onSelect={(hex) => updateDraftTheme('textColor', hex)}
                    ariaLabel="Color de textos"
                  />
                </div>

                <div className="block rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2">
                  <span className="[font-family:var(--font-body)] text-[0.75rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                    Overlay Fondo Expandido
                  </span>
                  <MonoSwatchPicker
                    value={draftTheme.expandedOverlayColor}
                    onSelect={(hex) => updateDraftTheme('expandedOverlayColor', hex)}
                    ariaLabel="Color del overlay expandido"
                  />
                </div>

                <label className="block rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                      Opacidad Overlay
                    </span>
                    <span className="[font-family:var(--font-body)] text-[0.72rem] font-medium" style={{ color: panelTextColor }}>
                      {Math.round(overlayOpacityPercent)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={overlayOpacityPercent}
                    onChange={(event) => updateDraftTheme('overlayOpacity', Number(event.target.value))}
                    className={rangeClassName}
                    style={sliderStyle}
                    aria-label="Opacidad del overlay expandido"
                  />
                </label>

                <button
                  type="button"
                  onClick={applyColorChanges}
                  className="w-full rounded-xl border px-3 py-2 [font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.12em] transition hover:bg-white/10"
                  style={applyButtonStyle}
                >
                  Aplicar Cambios
                </button>
              </div>
            </section>

            <section className="rounded-2xl border p-3" style={sectionCardStyle}>
              <SectionTitle title="[ MATERIAL CRISTAL ]" color={sectionTitleColor} />

              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                      Blur del Cristal
                    </span>
                    <span className="[font-family:var(--font-body)] text-[0.72rem] font-medium" style={{ color: panelTextColor }}>
                      {draftTheme.boxBlur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={draftTheme.boxBlur}
                    onChange={(event) => updateDraftTheme('boxBlur', Number(event.target.value))}
                    className={rangeClassName}
                    style={sliderStyle}
                    aria-label="Blur del cristal"
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                      Opacidad del Tinte
                    </span>
                    <span className="[font-family:var(--font-body)] text-[0.72rem] font-medium" style={{ color: panelTextColor }}>
                      {draftTheme.boxOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={draftTheme.boxOpacity}
                    onChange={(event) => updateDraftTheme('boxOpacity', Number(event.target.value))}
                    className={rangeClassName}
                    style={sliderStyle}
                    aria-label="Opacidad del tinte"
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                      Opacidad de Sombra
                    </span>
                    <span className="[font-family:var(--font-body)] text-[0.72rem] font-medium" style={{ color: panelTextColor }}>
                      {draftTheme.boxShadowOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={draftTheme.boxShadowOpacity}
                    onChange={(event) => updateDraftTheme('boxShadowOpacity', Number(event.target.value))}
                    className={rangeClassName}
                    style={sliderStyle}
                    aria-label="Opacidad de sombra"
                  />
                </label>

                <button
                  type="button"
                  onClick={applyMaterialChanges}
                  className="w-full rounded-xl border px-3 py-2 [font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.12em] transition hover:bg-white/10"
                  style={applyButtonStyle}
                >
                  Aplicar Cambios
                </button>
              </div>
            </section>

            <section className="rounded-2xl border p-3" style={sectionCardStyle}>
              <SectionTitle title="[ TIPOGRAFIA ]" color={sectionTitleColor} />

              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                      Fuente Global
                    </span>
                  </div>

                  <select
                    value={draftTheme.fontFamily}
                    onChange={(event) => updateDraftTheme('fontFamily', event.target.value)}
                    className="mt-2 w-full rounded-xl border px-3 py-2 [font-family:var(--font-body)] text-[0.78rem] font-semibold outline-none transition"
                    style={{
                      ...inputColorStyle,
                      color: panelTextColor,
                    }}
                    aria-label="Seleccionar fuente global"
                  >
                    <option value="Helvetica Neue, Helvetica, Arial, sans-serif">
                      Helvetica Neue
                    </option>
                  </select>
                </label>

                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.1em]" style={{ color: panelMutedTextColor }}>
                      Grosor Global
                    </span>
                    <span className="[font-family:var(--font-body)] text-[0.72rem] font-medium" style={{ color: panelTextColor }}>
                      {draftTheme.fontWeight}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={900}
                    step={100}
                    value={draftTheme.fontWeight}
                    onChange={(event) => updateDraftTheme('fontWeight', Number(event.target.value))}
                    className={rangeClassName}
                    style={sliderStyle}
                    aria-label="Grosor global de la tipografia"
                  />
                </label>

                <button
                  type="button"
                  onClick={applyTypographyChanges}
                  className="w-full rounded-xl border px-3 py-2 [font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.12em] transition hover:bg-white/10"
                  style={applyButtonStyle}
                >
                  Aplicar Tipografia
                </button>
              </div>
            </section>
          </div>

          <button
            type="button"
            onClick={handleResetTheme}
            className="mt-4 w-full rounded-xl border px-3 py-2 [font-family:var(--font-body)] text-[0.74rem] font-semibold uppercase tracking-[0.12em] transition"
            style={{
              borderColor: rgbaFromHex(draftTheme.accentColor, 0.3),
              color: panelTextColor,
              backgroundColor: rgbaFromHex(draftTheme.boxColor, Math.min(0.28, draftTheme.boxOpacity / 100 + 0.08)),
            }}
          >
            Reset Theme
          </button>
        </aside>
      ) : null}
    </div>
  )
}
