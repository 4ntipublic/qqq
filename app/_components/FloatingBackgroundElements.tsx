'use client'

import Image from 'next/image'
import { motion, useAnimation, useAnimationFrame } from 'framer-motion'
import { memo, useEffect, useMemo, useRef } from 'react'
import { rgbaFromHex } from './themeColor'

type FloatingBackgroundElementsProps = {
  accentColor: string
}

type AssetConfig = {
  id: string
  src: string
  width: number
  height: number
  baseOpacity: number
  sepia: number
  grayscale: number
  saturation: number
  cropScale?: number
  objectPosition?: string
}

type BodyState = {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  theta: number
  omega: number
  phase: number
}

const ASSETS: AssetConfig[] = [
  {
    id: 'kois',
    src: '/assets/kois.webp',
    width: 290,
    height: 230,
    baseOpacity: 0.1,
    sepia: 0.38,
    grayscale: 0.3,
    saturation: 0.84,
    cropScale: 1.22,
    objectPosition: '50% 52%',
  },
  {
    id: 'bys',
    src: '/assets/bys.png',
    width: 170,
    height: 170,
    baseOpacity: 0.07,
    sepia: 0.28,
    grayscale: 0.44,
    saturation: 0.82,
  },
  {
    id: 'koii',
    src: '/assets/koii.png',
    width: 160,
    height: 160,
    baseOpacity: 0.06,
    sepia: 0.26,
    grayscale: 0.48,
    saturation: 0.8,
  },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function FloatingBackgroundElementsComponent({ accentColor }: FloatingBackgroundElementsProps) {
  const koiControls = useAnimation()
  const bysControls = useAnimation()
  const koiiControls = useAnimation()

  const controls = useMemo(() => [koiControls, bysControls, koiiControls], [koiControls, bysControls, koiiControls])

  const bodiesRef = useRef<BodyState[]>([])
  const viewportRef = useRef({ width: 0, height: 0 })
  const elapsedRef = useRef(0)
  const isReadyRef = useRef(false)

  const tintOverlay = useMemo(() => rgbaFromHex(accentColor, 0.22), [accentColor])
  const accentGlow = useMemo(() => rgbaFromHex(accentColor, 0.22), [accentColor])

  useEffect(() => {
    const refreshViewport = () => {
      viewportRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
    }

    refreshViewport()

    bodiesRef.current = ASSETS.map((asset, index) => {
      const maxX = Math.max(0, viewportRef.current.width - asset.width)
      const maxY = Math.max(0, viewportRef.current.height - asset.height)

      return {
        x: maxX * (0.18 + index * 0.29),
        y: maxY * (0.15 + index * 0.31),
        vx: 8 + index * 2.6,
        vy: 6.5 + index * 1.8,
        ax: 0,
        ay: 0,
        theta: index * 6,
        omega: 0,
        phase: 1.2 + index * 1.35,
      }
    })
    isReadyRef.current = true

    const onResize = () => {
      refreshViewport()
      bodiesRef.current = bodiesRef.current.map((body, index) => {
        const asset = ASSETS[index]
        const maxX = Math.max(0, viewportRef.current.width - asset.width)
        const maxY = Math.max(0, viewportRef.current.height - asset.height)

        return {
          ...body,
          x: clamp(body.x, 0, maxX),
          y: clamp(body.y, 0, maxY),
        }
      })
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      isReadyRef.current = false
      elapsedRef.current = 0
    }
  }, [controls])

  useAnimationFrame((_timestamp, deltaMilliseconds) => {
    if (!isReadyRef.current) {
      return
    }

    const dt = clamp(deltaMilliseconds / 1000, 0.008, 0.05)
    elapsedRef.current += dt
    const time = elapsedRef.current

    bodiesRef.current.forEach((body, index) => {
      const asset = ASSETS[index]
      const maxX = Math.max(0, viewportRef.current.width - asset.width)
      const maxY = Math.max(0, viewportRef.current.height - asset.height)

      // Slow underwater flow field + gentle buoyancy wobble.
      body.ax = Math.sin(time * 0.2 + body.phase) * 7.5 + Math.cos(time * 0.11 + index) * 3.2
      body.ay = Math.cos(time * 0.18 + body.phase * 0.9) * 6.3 + Math.sin(time * 0.09 + index * 0.7) * 2.8

      body.vx += body.ax * dt
      body.vy += body.ay * dt

      const drag = Math.exp(-0.42 * dt)
      body.vx *= drag
      body.vy *= drag

      body.x += body.vx * dt
      body.y += body.vy * dt

      if (body.x <= 0) {
        body.x = 0
        body.vx = Math.abs(body.vx) * 0.72
      } else if (body.x >= maxX) {
        body.x = maxX
        body.vx = -Math.abs(body.vx) * 0.72
      }

      if (body.y <= 0) {
        body.y = 0
        body.vy = Math.abs(body.vy) * 0.72
      } else if (body.y >= maxY) {
        body.y = maxY
        body.vy = -Math.abs(body.vy) * 0.72
      }

      body.omega += Math.sin(time * 0.31 + body.phase) * 0.45 * dt
      body.omega *= Math.exp(-1.2 * dt)
      body.theta += body.omega + Math.sin(time * 0.44 + body.phase) * 0.045

      const wobble = Math.sin(time * 0.36 + body.phase) * 2.4
      const scale = 1 + Math.sin(time * 0.28 + body.phase) * 0.024

      controls[index].set({
        x: body.x,
        y: body.y,
        rotate: body.theta + wobble,
        scale,
      })
    })
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-[-5] overflow-hidden" aria-hidden="true">
      {ASSETS.map((asset, index) => (
        <motion.div
          key={asset.id}
          animate={controls[index]}
          initial={false}
          className="absolute overflow-hidden"
          style={{
            width: `${asset.width}px`,
            height: `${asset.height}px`,
            opacity: asset.baseOpacity,
            filter: `grayscale(${asset.grayscale}) sepia(${asset.sepia}) saturate(${asset.saturation}) drop-shadow(0 0 18px ${accentGlow})`,
            mixBlendMode: 'screen',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          <Image
            src={asset.src}
            alt=""
            fill
            sizes={`${asset.width}px`}
            quality={60}
            priority
            className="select-none object-contain"
            draggable={false}
            style={{
              objectPosition: asset.objectPosition ?? 'center',
              transform: `scale(${asset.cropScale ?? 1})`,
              transformOrigin: '50% 50%',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: tintOverlay,
              mixBlendMode: 'color',
              opacity: 0.42,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

const FloatingBackgroundElements = memo(FloatingBackgroundElementsComponent)

export default FloatingBackgroundElements
