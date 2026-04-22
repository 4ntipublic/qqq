'use client'

import { forwardRef, useMemo, type CSSProperties, type HTMLAttributes } from 'react'

type WaterProps = HTMLAttributes<HTMLDivElement> & {
  speed?: number
  depth?: number
  clarity?: number
  waves?: number
  reflection?: number
}

const joinClassNames = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ')

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const Water = forwardRef<HTMLDivElement, WaterProps>(
  ({ className, speed = 1, depth = 1, clarity = 1, waves = 1, reflection = 1, ...props }, ref) => {
    // Map user controls to CSS variables so animation stays on the compositor and avoids JS frame work.
    const visualStyle = useMemo<CSSProperties>(() => {
      const speedValue = clamp(speed, 0.1, 3)
      const depthValue = clamp(depth, 0, 2)
      const clarityValue = clamp(clarity, 0, 2)
      const wavesValue = clamp(waves, 0.2, 3)
      const reflectionValue = clamp(reflection, 0, 2)

      const depthMix = depthValue / 2
      const clarityMix = clarityValue / 2
      const waveMix = (wavesValue - 0.2) / 2.8
      const reflectionMix = reflectionValue / 2

      const tintAlpha = (0.9 - clarityMix * 0.22).toFixed(3)
      const baseRed = Math.round(8 + depthMix * 20)
      const baseGreen = Math.round(46 + clarityMix * 56)
      const baseBlue = Math.round(78 + depthMix * 66 + reflectionMix * 24)

      return {
        ['--water-base' as string]: `rgba(${baseRed}, ${baseGreen}, ${baseBlue}, ${tintAlpha})`,
        ['--water-depth-shadow' as string]: `rgba(2, 12, 28, ${(0.18 + depthMix * 0.3).toFixed(3)})`,
        ['--water-caustics-alpha' as string]: String(0.12 + clarityMix * 0.22),
        ['--water-wave-alpha' as string]: String(0.08 + waveMix * 0.18),
        ['--water-reflection-alpha' as string]: String(0.09 + reflectionMix * 0.24),
        ['--water-drift-duration' as string]: `${(34 / speedValue).toFixed(2)}s`,
        ['--water-wave-duration' as string]: `${(24 / (speedValue * (0.6 + waveMix))).toFixed(2)}s`,
        ['--water-shimmer-duration' as string]: `${(14 / (speedValue * (0.75 + reflectionMix * 0.6))).toFixed(2)}s`,
      } as CSSProperties
    }, [clarity, depth, reflection, speed, waves])

    return (
      <div className={joinClassNames('water-root h-full w-full', className)} style={visualStyle} ref={ref} {...props}>
        <div className="water-layer water-layer--base" />
        <div className="water-layer water-layer--waves" />
        <div className="water-layer water-layer--caustics" />
        <div className="water-layer water-layer--reflection" />
        <div className="water-layer water-layer--grain" />

        <style jsx>{`
          .water-root {
            position: relative;
            overflow: hidden;
            background: radial-gradient(120% 140% at 50% -20%, rgba(255, 255, 255, 0.18), transparent 42%),
              linear-gradient(180deg, var(--water-base) 0%, rgba(4, 28, 52, 0.94) 100%);
          }

          .water-layer {
            position: absolute;
            inset: -24%;
            pointer-events: none;
            transform: translate3d(0, 0, 0);
          }

          .water-layer--base {
            background:
              radial-gradient(circle at 20% 24%, rgba(255, 255, 255, 0.14), transparent 34%),
              radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1), transparent 30%),
              linear-gradient(180deg, transparent 0%, var(--water-depth-shadow) 100%);
            animation: waterDrift var(--water-drift-duration) linear infinite;
          }

          .water-layer--waves {
            opacity: var(--water-wave-alpha);
            mix-blend-mode: screen;
            background:
              radial-gradient(closest-side at 10% 35%, rgba(170, 220, 255, 0.7), transparent 70%),
              radial-gradient(closest-side at 50% 48%, rgba(110, 185, 255, 0.64), transparent 68%),
              radial-gradient(closest-side at 86% 42%, rgba(180, 230, 255, 0.62), transparent 66%);
            filter: blur(10px);
            animation: waterWaves var(--water-wave-duration) ease-in-out infinite alternate;
          }

          .water-layer--caustics {
            opacity: var(--water-caustics-alpha);
            mix-blend-mode: color-dodge;
            background:
              repeating-radial-gradient(circle at 32% 22%, rgba(220, 250, 255, 0.86) 0 7px, transparent 8px 30px),
              repeating-radial-gradient(circle at 74% 78%, rgba(195, 235, 255, 0.78) 0 6px, transparent 7px 26px);
            filter: blur(2.5px);
            animation: waterCaustics calc(var(--water-drift-duration) * 1.25) linear infinite;
          }

          .water-layer--reflection {
            opacity: var(--water-reflection-alpha);
            background:
              linear-gradient(125deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.06) 30%, transparent 58%),
              linear-gradient(300deg, rgba(170, 220, 255, 0.34) 0%, transparent 42%);
            mix-blend-mode: screen;
            animation: waterShimmer var(--water-shimmer-duration) ease-in-out infinite;
          }

          .water-layer--grain {
            inset: 0;
            opacity: 0.07;
            background-image: radial-gradient(rgba(255, 255, 255, 0.22) 0.45px, transparent 0.45px);
            background-size: 2px 2px;
            mix-blend-mode: soft-light;
          }

          @keyframes waterDrift {
            0% {
              transform: translate3d(-3%, -2%, 0) scale(1.05);
            }
            50% {
              transform: translate3d(2%, 2%, 0) scale(1.08);
            }
            100% {
              transform: translate3d(-3%, -2%, 0) scale(1.05);
            }
          }

          @keyframes waterWaves {
            0% {
              transform: translate3d(-2%, -1%, 0) rotate(-1.4deg) scale(1.02);
            }
            100% {
              transform: translate3d(2%, 1%, 0) rotate(1.4deg) scale(1.08);
            }
          }

          @keyframes waterCaustics {
            0% {
              transform: translate3d(-5%, -2%, 0) scale(1.08);
            }
            100% {
              transform: translate3d(5%, 2%, 0) scale(1.14);
            }
          }

          @keyframes waterShimmer {
            0%,
            100% {
              transform: translate3d(-5%, -3%, 0) rotate(-2deg);
            }
            50% {
              transform: translate3d(4%, 2%, 0) rotate(2deg);
            }
          }
        `}</style>
      </div>
    )
  }
)

Water.displayName = 'Water'

export default Water
