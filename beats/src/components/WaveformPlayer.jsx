import { useEffect, useRef } from 'react'

export function WaveformPlayer({ 
  beat, 
  isPlaying, 
  onToggle, 
  duration, 
  currentTime, 
  onSeek,
  audioRef,
  analyserRef,
  analyserReady
}) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const smoothedEnergyRef = useRef(0.24)
  const lastFrameAtRef = useRef(0)

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      const now = performance.now()
      if (now - lastFrameAtRef.current < 34) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      lastFrameAtRef.current = now

      const ctx = canvas.getContext('2d')
      const pixelRatio = window.devicePixelRatio || 1
      const displayWidth = canvas.clientWidth || 720
      const displayHeight = canvas.clientHeight || 54
      const nextWidth = Math.floor(displayWidth * pixelRatio)
      const nextHeight = Math.floor(displayHeight * pixelRatio)
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth
        canvas.height = nextHeight
      }
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const width = displayWidth
      const height = displayHeight
      ctx.clearRect(0, 0, width, height)

      const analyser = analyserRef?.current
      const centerY = height / 2
      let energy = smoothedEnergyRef.current
      let waveformData = null
      let sharedSignal = null

      if (analyser) {
        try {
          const data = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(data)
          const total = data.reduce((sum, v) => sum + v, 0)
          const rawEnergy = total / (data.length * 255)
          const nextEnergy = Math.max(0.16, Math.min(1.0, rawEnergy * 1.75))
          energy = smoothedEnergyRef.current * 0.88 + nextEnergy * 0.12
          smoothedEnergyRef.current = energy

          waveformData = new Uint8Array(analyser.fftSize)
          analyser.getByteTimeDomainData(waveformData)

        const points = 180
        sharedSignal = new Float32Array(points)
        const step = (waveformData.length - 1) / (points - 1)
        for (let i = 0; i < points; i += 1) {
          const idx = Math.floor(i * step)
          const raw = (waveformData[idx] - 128) / 128
          const prev = i > 0 ? sharedSignal[i - 1] : raw
          sharedSignal[i] = prev * 0.78 + raw * 0.22
        }
        } catch (err) {
          console.error('Analyser error:', err)
        }
      }

      const time = performance.now() * 0.0017
      const layers = [
        { opacity: 0.9, width: 1.2, amp: 1.0, phase: 0.0, delay: 0.0, drift: 0.0, yOffset: 0, sampleShift: 0 },
        {
          opacity: 0.5,
          width: 1,
          amp: 1.06,
          phase: 0.3,
          delay: 0.2,
          drift: 0.15,
          yOffset: -0.02,
          sampleShift: -1,
        },
        {
          opacity: 0.35,
          width: 0.8,
          amp: 1.12,
          phase: 0.6,
          delay: 0.4,
          drift: -0.12,
          yOffset: 0.02,
          sampleShift: 1,
        },
        {
          opacity: 0.2,
          width: 0.6,
          amp: 1.2,
          phase: 0.9,
          delay: 0.6,
          drift: 0.18,
          yOffset: 0.01,
          sampleShift: 2,
        },
      ]

      layers.forEach((layer) => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0, 0, 0, ${layer.opacity})`
        ctx.lineWidth = layer.width
        const dynamicAmp = Math.max(7, height * 0.43 * energy * layer.amp)
        const animatedAmp = isPlaying
          ? dynamicAmp * (1 + Math.sin(time + layer.delay) * layer.drift)
          : dynamicAmp
        const animatedCenter = isPlaying
          ? centerY +
            height * layer.yOffset +
            Math.sin(time * 0.8 + layer.phase) * (height * 0.055 * Math.abs(layer.drift))
          : centerY
        for (let x = 0; x <= width; x += 1) {
          const normalizedX = (x - width / 2) / (width / 2)
          const envelope = Math.exp(-Math.pow(normalizedX * 1.45, 2))

          let sharedOffset = 0
          if (sharedSignal) {
            const sigIdx = Math.floor((x / width) * (sharedSignal.length - 1))
            const shiftedIdx = Math.max(
              0,
              Math.min(sharedSignal.length - 1, sigIdx + (isPlaying ? layer.sampleShift : 0)),
            )
            sharedOffset = sharedSignal[shiftedIdx] * animatedAmp * 0.95 * envelope
          }

          const subtleMotion =
            Math.sin(x * 0.0105 + time + layer.phase + layer.delay) * (animatedAmp * 0.08) * envelope
          const y =
            animatedCenter +
            sharedOffset +
            subtleMotion

          const safePadding = 2
          const clampedY = Math.min(height - safePadding, Math.max(safePadding, y))
          if (x === 0) {
            ctx.moveTo(x, clampedY)
          } else {
            ctx.lineTo(x, clampedY)
          }
        }
        ctx.stroke()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, analyserReady])

  const seekFromClientX = (clientX, targetElement) => {
    if (!audioRef.current || !duration || !targetElement) return
    const rect = targetElement.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const nextTime = ratio * duration
    audioRef.current.currentTime = nextTime
    onSeek(nextTime)
  }

  const handleCanvasClick = () => {
    onToggle()
  }

  const handleCanvasPointerDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    
    const canvas = event.currentTarget
    
    const move = (moveEvent) => {
      seekFromClientX(moveEvent.clientX, canvas)
    }

    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    
    // Initial seek
    seekFromClientX(event.clientX, canvas)
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="wave-canvas"
      onClick={handleCanvasClick}
      onPointerDown={handleCanvasPointerDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      style={{ cursor: 'pointer', display: 'block', width: '100%', height: '80px', background: 'transparent', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', userSelect: 'none' }}
      onKeyDown={(event) => {
        if (!duration || !audioRef.current) return
        const step = Math.max(1, duration * 0.02)
        if (event.key === 'ArrowRight') {
          const next = Math.min(duration, audioRef.current.currentTime + step)
          audioRef.current.currentTime = next
          onSeek(next)
        }
        if (event.key === 'ArrowLeft') {
          const next = Math.max(0, audioRef.current.currentTime - step)
          audioRef.current.currentTime = next
          onSeek(next)
        }
      }}
    />
  )
}
