import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner.jsx'
import { Badge } from './components/ui/badge.jsx'
import { Button } from './components/ui/button.jsx'
import { Card, CardContent } from './components/ui/card.jsx'
import { WaveformPlayer } from './components/WaveformPlayer.jsx'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './components/ui/drawer.jsx'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/ui/sheet.jsx'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './components/ui/hover-card.jsx'
import { Input } from './components/ui/input.jsx'
import { Checkbox } from './components/ui/checkbox.jsx'

const PREVIEW_AUDIO = '/STAY_beat.wav'

const beats = [
  { id: 'u1', name: 'uno.wav', type: 'Trap / Jerk', note: '#B minor', bpm: 148, audio: PREVIEW_AUDIO },
  { id: 'u2', name: 'dos.wav', type: 'Trap / Jerk', note: '#F minor', bpm: 136, audio: PREVIEW_AUDIO },
  { id: 'u3', name: 'tres.wav', type: 'Trap / Jerk', note: '#D minor', bpm: 144, audio: PREVIEW_AUDIO },
  { id: 'u4', name: 'cuatro.wav', type: 'Hip Hop', note: '#G minor', bpm: 92, audio: PREVIEW_AUDIO },
  { id: 'u5', name: 'cinco.wav', type: 'R&B', note: '#A minor', bpm: 120, audio: PREVIEW_AUDIO },
  { id: 'u6', name: 'seis.wav', type: 'Drill', note: '#C minor', bpm: 142, audio: PREVIEW_AUDIO },
  { id: 'u7', name: 'siete.wav', type: 'Reggaeton', note: '#E minor', bpm: 96, audio: PREVIEW_AUDIO },
  { id: 'u8', name: 'ocho.wav', type: 'Afrobeats', note: '#A# minor', bpm: 108, audio: PREVIEW_AUDIO },
  { id: 'u9', name: 'nueve.wav', type: 'Dubstep', note: '#D# minor', bpm: 140, audio: PREVIEW_AUDIO },
  { id: 'u10', name: 'diez.wav', type: 'Techno', note: '#B minor', bpm: 128, audio: PREVIEW_AUDIO },
  { id: 'u11', name: 'once.wav', type: 'Trap', note: '#F minor', bpm: 145, audio: PREVIEW_AUDIO },
  { id: 'u12', name: 'doce.wav', type: 'Hip Hop', note: '#G minor', bpm: 95, audio: PREVIEW_AUDIO },
  { id: 'u13', name: 'trece.wav', type: 'R&B', note: '#A minor', bpm: 125, audio: PREVIEW_AUDIO },
  { id: 'u14', name: 'catorce.wav', type: 'Drill', note: '#C minor', bpm: 140, audio: PREVIEW_AUDIO },
  { id: 'u15', name: 'quince.wav', type: 'Reggaeton', note: '#E minor', bpm: 98, audio: PREVIEW_AUDIO },
  { id: 'u16', name: 'dieciseis.wav', type: 'Afrobeats', note: '#A# minor', bpm: 110, audio: PREVIEW_AUDIO },
  { id: 'u17', name: 'diecisiete.wav', type: 'Dubstep', note: '#D# minor', bpm: 142, audio: PREVIEW_AUDIO },
  { id: 'u18', name: 'dieciocho.wav', type: 'Techno', note: '#B minor', bpm: 130, audio: PREVIEW_AUDIO },
]

function BeatRow({ beat, isPlaying, onTogglePlay, onOpenPurchase, pauseCurrentAudio }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const onTogglePlayRef = useRef(onTogglePlay)
  const smoothedEnergyRef = useRef(0.24)
  const lastFrameAtRef = useRef(0)
  const [playError, setPlayError] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  useEffect(() => {
    onTogglePlayRef.current = onTogglePlay
  }, [onTogglePlay])

  useEffect(() => {
    audioRef.current = new Audio(beat.audio)
    audioRef.current.crossOrigin = ''
    audioRef.current.preload = 'metadata'
    const handleEnded = () => onTogglePlayRef.current(null, null)
    const handleLoadedMetadata = () => setDuration(audioRef.current?.duration ?? 0)
    const handleTimeUpdate = () => setCurrentTime(audioRef.current?.currentTime ?? 0)
    audioRef.current.addEventListener('ended', handleEnded)
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      audioRef.current?.removeEventListener('ended', handleEnded)
      audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      audioRef.current?.pause()
      audioRef.current = null
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [beat.audio])

  useEffect(() => {
    if (!isPlaying && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }, [isPlaying])

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

      const analyser = analyserRef.current
      const centerY = height / 2
      let energy = smoothedEnergyRef.current
      let waveformData = null
      let sharedSignal = null

      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const total = data.reduce((sum, v) => sum + v, 0)
        const rawEnergy = total / (data.length * 255)
        const nextEnergy = Math.max(0.16, Math.min(1.0, rawEnergy * 1.75))
        energy = smoothedEnergyRef.current * 0.88 + nextEnergy * 0.12
        smoothedEnergyRef.current = energy

        waveformData = new Uint8Array(analyser.fftSize)
        analyser.getByteTimeDomainData(waveformData)

        // Build one smoothed waveform curve shared across layers.
        const points = 180
        sharedSignal = new Float32Array(points)
        const step = (waveformData.length - 1) / (points - 1)
        for (let i = 0; i < points; i += 1) {
          const idx = Math.floor(i * step)
          const raw = (waveformData[idx] - 128) / 128
          const prev = i > 0 ? sharedSignal[i - 1] : raw
          sharedSignal[i] = prev * 0.78 + raw * 0.22
        }
      }

      const time = performance.now() * 0.0017
      const layers = [
        { opacity: 0.9, width: 2, amp: 1.0, phase: 0.0, delay: 0.0, drift: 0.0, yOffset: 0, sampleShift: 0 },
        {
          opacity: 0.42,
          width: 1.7,
          amp: 1.06,
          phase: 0.7,
          delay: 0.8,
          drift: 0.24,
          yOffset: -0.11,
          sampleShift: -4,
        },
        {
          opacity: 0.3,
          width: 1.45,
          amp: 1.18,
          phase: 1.2,
          delay: 1.4,
          drift: -0.22,
          yOffset: 0.09,
          sampleShift: 3,
        },
        {
          opacity: 0.22,
          width: 1.25,
          amp: 1.3,
          phase: 1.8,
          delay: 2.1,
          drift: 0.28,
          yOffset: 0.14,
          sampleShift: 7,
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
        for (let x = 0; x <= width; x += 2) {
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
  }, [])

  const setupAudioGraph = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new window.AudioContext()
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current)
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.9
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioCtxRef.current.destination)
    }
  }

  const seekFromClientX = (clientX, targetElement) => {
    if (!audioRef.current || !duration || !targetElement) return
    const rect = targetElement.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const nextTime = ratio * duration
    audioRef.current.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleProgressPointerDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    
    const progressTrack = event.currentTarget
    
    const move = (moveEvent) => {
      seekFromClientX(moveEvent.clientX, progressTrack)
    }

    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    
    // Initial seek
    seekFromClientX(event.clientX, progressTrack)
  }

  const handlePlay = async () => {
    if (!audioRef.current) return
    setPlayError('')

    if (isPlaying) {
      audioRef.current.pause()
      pauseCurrentAudio()
      return
    }

    try {
      // Only reload if the audio source is different or not loaded
      if (!audioRef.current.src || audioRef.current.src !== beat.audio) {
        audioRef.current.src = beat.audio
        audioRef.current.load()

        await new Promise((resolve, reject) => {
          const onReady = () => {
            audioRef.current?.removeEventListener('canplaythrough', onReady)
            audioRef.current?.removeEventListener('error', onError)
            resolve()
          }
          const onError = () => {
            audioRef.current?.removeEventListener('canplaythrough', onReady)
            audioRef.current?.removeEventListener('error', onError)
            reject(new Error('Audio file failed to load'))
          }
          audioRef.current?.addEventListener('canplaythrough', onReady, { once: true })
          audioRef.current?.addEventListener('error', onError, { once: true })
        })
      }

      await setupAudioGraph()
      await audioRef.current.play()
      onTogglePlay(beat.id, audioRef.current)
    } catch (error) {
      audioRef.current.pause()
      setPlayError(`Could not load ${beat.name}`)
    }
  }

  return (
    <Card className="beat-row">
      <CardContent className="beat-row-content">
        <div className="beat-main">
          <div className="beat-header">
            <div className="beat-heading">
              <p
                className="beat-title"
                onClick={() => onOpenPurchase(beat, duration)}
                style={{ cursor: 'pointer' }}
              >
                {beat.name}
              </p>
              <div className="beat-tags">
                <Badge>{beat.note}</Badge>
                <Badge variant="secondary">{beat.bpm} BPM</Badge>
              </div>
            </div>
            <span className="duration-text">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div
            className="wave-row"
            onClick={handlePlay}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handlePlay()
              }
            }}
            aria-label={`Toggle preview for ${beat.name}`}
          >
            <canvas ref={canvasRef} className="wave-canvas" />
          </div>
          <div className="progress-row">
            <div
              className="progress-track"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration || 0)}
              aria-valuenow={Math.round(currentTime)}
              tabIndex={0}
              onPointerDown={handleProgressPointerDown}
              onClick={(event) => {
                event.stopPropagation()
              }}
              onKeyDown={(event) => {
                if (!duration || !audioRef.current) return
                const step = Math.max(1, duration * 0.02)
                if (event.key === 'ArrowRight') {
                  const next = Math.min(duration, audioRef.current.currentTime + step)
                  audioRef.current.currentTime = next
                  setCurrentTime(next)
                }
                if (event.key === 'ArrowLeft') {
                  const next = Math.max(0, audioRef.current.currentTime - step)
                  audioRef.current.currentTime = next
                  setCurrentTime(next)
                }
              }}
            >
              <div
                className="progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, (currentTime / (duration || 1)) * 100))}%` }}
              />
            </div>
          </div>
          {playError ? <p className="play-error">{playError}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default function App() {
  const [playingId, setPlayingId] = useState(null)
  const currentAudioRef = useRef(null)
  const [selectedBeat, setSelectedBeat] = useState(null)
  const [selectedBeatDuration, setSelectedBeatDuration] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [cart, setCart] = useState([])
  const [email, setEmail] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsAlert, setTermsAlert] = useState(false)
  const [emailAlert, setEmailAlert] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const drawerTriggerId = useRef(null)
  
  const beatsPerPage = 6
  const totalPages = Math.ceil(beats.length / beatsPerPage)
  const startIndex = (currentPage - 1) * beatsPerPage
  const endIndex = startIndex + beatsPerPage
  const currentBeats = beats.slice(startIndex, endIndex)

  const isValidEmail = (emailString) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailString)
  }

  const handleTogglePlay = (nextId, audioElement) => {
    if (currentAudioRef.current && currentAudioRef.current !== audioElement) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    currentAudioRef.current = audioElement ?? null
    setPlayingId(nextId)
  }

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
      setPlayingId(null)
    }
  }

  const pauseCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      setPlayingId(null)
    }
  }

  // Drawer audio state
  const [drawerPlaying, setDrawerPlaying] = useState(false)

  // Auto-play when drawer opens, auto-stop when drawer closes
  useEffect(() => {
    if (isDrawerOpen) {
      setDrawerPlaying(true)
    } else {
      setDrawerPlaying(false)
    }
  }, [isDrawerOpen])

  const handleDrawerPlay = () => {
    setDrawerPlaying(!drawerPlaying)
  }

  const handleOpenDrawer = (beat, duration = 0) => {
    stopCurrentAudio()
    setSelectedBeat(beat)
    setSelectedBeatDuration(duration)
    setIsDrawerOpen(true)
    const beatCartItem = cart.find(item => item.beat.id === beat.id)
    setSelectedLicense(beatCartItem ? beatCartItem.licenseType : null)
  }

  // Simple audio player for drawer header
function DrawerAudioPlayer({ beat, isPlaying, onToggle, isDrawerOpen }) {
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [analyserReady, setAnalyserReady] = useState(false)

  // Stop audio immediately when drawer closes
  useEffect(() => {
    if (!isDrawerOpen) {
      stopAudio()
    }
  }, [isDrawerOpen])

  useEffect(() => {
    audioRef.current = new Audio(beat.audio)
    audioRef.current.crossOrigin = ''
    audioRef.current.preload = 'metadata'
    
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current?.duration ?? 0)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current?.currentTime ?? 0)
    }
    const handleEnded = () => {
      setCurrentTime(0)
    }
    
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('ended', handleEnded)
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('ended', handleEnded)
      }
      // Disconnect audio context nodes
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          console.error('Error disconnecting source:', e)
        }
        sourceRef.current = null
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect()
        } catch (e) {
          console.error('Error disconnecting analyser:', e)
        }
        analyserRef.current = null
      }
    }
  }, [beat.audio])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      // Disconnect from audio context
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          console.error('Error disconnecting source:', e)
        }
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect()
        } catch (e) {
          console.error('Error disconnecting analyser:', e)
        }
      }
    }
    setCurrentTime(0)
  }

  const setupAudioGraph = async () => {
    if (!audioRef.current) return
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }
      
      // Wait a tiny bit to ensure context is ready
      await new Promise(resolve => setTimeout(resolve, 10))
      
      if (!sourceRef.current) {
        sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current)
        analyserRef.current = audioCtxRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        analyserRef.current.smoothingTimeConstant = 0.9
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioCtxRef.current.destination)
        
        setAnalyserReady(true)
        
        console.log('Audio graph setup complete', {
          analyser: analyserRef.current,
          fftSize: analyserRef.current.fftSize,
          frequencyBinCount: analyserRef.current.frequencyBinCount
        })
      }
    } catch (err) {
      console.error('Audio graph setup error:', err)
    }
  }

  // Setup audio graph and play when isPlaying becomes true
  useEffect(() => {
    const handlePlayStateChange = async () => {
      if (!audioRef.current) return
      
      if (isPlaying) {
        await setupAudioGraph()
        // Small delay to ensure connections are made before playing
        setTimeout(() => {
          audioRef.current?.play().catch(err => console.error('Play error:', err))
        }, 50)
      } else {
        stopAudio()
      }
    }
    
    handlePlayStateChange()
  }, [isPlaying])

  return (
    <div style={{ width: '100%' }}>
      <WaveformPlayer 
        beat={beat}
        isPlaying={isPlaying}
        onToggle={onToggle}
        duration={duration}
        currentTime={currentTime}
        onSeek={setCurrentTime}
        audioRef={audioRef}
        analyserRef={analyserRef}
        analyserReady={analyserReady}
      />
      <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'center', paddingX: '16px' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  )
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

  const handleAddToCart = (beat, licenseType, price) => {
    const cartItemId = `${beat.id}-${licenseType}`
    const itemExists = cart.some(item => item.id === cartItemId)
    
    if (itemExists) {
      setCart(prevCart => prevCart.filter(item => item.id !== cartItemId))
      setSelectedLicense(null)
      toast.dismiss()
      toast.error('Licencia removida')
    } else {
      const cartItem = {
        id: cartItemId,
        beatName: beat.name,
        licenseType,
        price,
        beat
      }
      setCart(prevCart => [...prevCart, cartItem])
      setSelectedLicense(licenseType)
      toast.dismiss()
      toast.info('Licencia añadida')
    }
  }

  const handleRemoveFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0)
  }

  const handleCheckout = () => {
    if (!isValidEmail(email)) {
      setEmailAlert(true)
      setTimeout(() => setEmailAlert(false), 600)
      return
    }
    if (!termsAccepted) {
      setTermsAlert(true)
      setTimeout(() => setTermsAlert(false), 600)
      return
    }
    // Handle actual checkout here
  }

  return (
    <main className="page">
      <Toaster />
      <header className="top-bar">
        <h1 className="brand">Pky.</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="cart-button">
              🛒 Carrito
              {cart.length > 0 && (
                <Badge className="cart-badge">{cart.length}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Carrito de compras</SheetTitle>
              <SheetDescription>
                {cart.length === 0 ? "Tu carrito está vacío" : `${cart.length} artículos en tu carrito`}
              </SheetDescription>
            </SheetHeader>
            <div style={{ borderTop: '1px solid #e0e0e0' }} />
            <div style={{ flex: 1, overflowY: 'auto', marginRight: '-12px', paddingRight: '12px' }}>
              {cart.length === 0 ? (
                <p className="empty-cart">No hay artículos en el carrito</p>
              ) : (
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.beatName}</h4>
                        <p>{item.licenseType}</p>
                        <p className="cart-item-price">${item.price}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px', flexShrink: 0 }}>
              <div className="cart-email-section" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="cart-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                <Input
                  id="cart-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailAlert ? 'email-alert' : ''}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <Checkbox
                    id="terms-acceptance"
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                  />
                  <label 
                    htmlFor="terms-acceptance" 
                    className={termsAlert ? 'terms-alert' : ''}
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      cursor: 'pointer', 
                      margin: 0
                    }}
                  >
                    Acepto los términos y condiciones
                  </label>
                </div>
              </div>
              {cart.length > 0 && (
                <>
                  <div className="cart-total">
                    <strong>Total: ${getTotalPrice()}</strong>
                  </div>
                  <Button className="checkout-button" onClick={handleCheckout}>Ir a pagar</Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <section className="beats-list">
        {currentBeats.map((beat) => (
          <BeatRow
            key={beat.id}
            beat={beat}
            isPlaying={playingId === beat.id}
            onTogglePlay={handleTogglePlay}
            onOpenPurchase={handleOpenDrawer}
            pauseCurrentAudio={pauseCurrentAudio}
          />
        ))}
        
        {totalPages > 1 && (
          <div className="simple-pagination">
            <button 
              className="pagination-btn prev-btn"
              onClick={() => {
                stopCurrentAudio()
                setCurrentPage(prev => Math.max(1, prev - 1))
              }}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => {
                    stopCurrentAudio()
                    setCurrentPage(page)
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn next-btn"
              onClick={() => {
                stopCurrentAudio()
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
              }}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          {selectedBeat && (
            <>
              <div style={{ padding: '20px 16px 12px 16px', textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{selectedBeat.name}</h2>
              </div>
              <div style={{ width: '100%', padding: '0 0 12px 0' }}>
                <DrawerAudioPlayer beat={selectedBeat} isPlaying={drawerPlaying} onToggle={handleDrawerPlay} isDrawerOpen={isDrawerOpen} />
              </div>

              <div className="license-drawer-layout" style={{ padding: '16px 16px 0 16px' }}>
                <section className="license-left">
                  <div className="license-image-placeholder" />
                  <h2 className="license-beat-name">{selectedBeat.name}</h2>
                  <p className="license-subtitle">Info del beat</p>
                  <div className="license-meta-grid">
                    <p>
                      <span>Tipo</span>
                      <strong>{selectedBeat.type}</strong>
                    </p>
                    <p>
                      <span>Tono</span>
                      <strong>{selectedBeat.note}</strong>
                    </p>
                    <p>
                      <span>BPM</span>
                      <strong>{selectedBeat.bpm}</strong>
                    </p>
                    <p>
                      <span>Duracion</span>
                      <strong>{selectedBeatDuration > 0 ? `${Math.floor(selectedBeatDuration / 60)}:${String(Math.floor(selectedBeatDuration % 60)).padStart(2, '0')}` : 'N/A'}</strong>
                    </p>
                  </div>
                </section>

                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>Elige tu licencia</h3>

                  <section className="license-right">
                  <article className="license-option">
                    <header>
                      <strong>MP3 Lease</strong>
                      <span>$20</span>
                    </header>
                    <p>Incluye MP3 a 320kbps.</p>
                    <Button 
                      onClick={() => handleAddToCart(selectedBeat, 'MP3 Lease', 20)}
                      style={selectedLicense === 'MP3 Lease' ? { backgroundColor: '#2563eb', color: 'white' } : {}}
                      disabled={selectedLicense && selectedLicense !== 'MP3 Lease'}
                    >
                      {selectedLicense === 'MP3 Lease' ? 'Remover' : 'Anadir al carrito'}
                    </Button>
                  </article>

                  <article className="license-option">
                    <header>
                      <strong>WAV Lease</strong>
                      <span>$25</span>
                    </header>
                    <p>Incluye WAV + MP3.</p>
                    <Button 
                      onClick={() => handleAddToCart(selectedBeat, 'WAV Lease', 25)}
                      style={selectedLicense === 'WAV Lease' ? { backgroundColor: '#2563eb', color: 'white' } : {}}
                      disabled={selectedLicense && selectedLicense !== 'WAV Lease'}
                    >
                      {selectedLicense === 'WAV Lease' ? 'Remover' : 'Anadir al carrito'}
                    </Button>
                  </article>

                  <article className="license-option">
                    <header>
                      <strong>Trackouts (Stems)</strong>
                      <span>$40</span>
                    </header>
                    <p>Incluye stems + WAV + MP3.</p>
                    <Button 
                      onClick={() => handleAddToCart(selectedBeat, 'Trackouts (Stems)', 40)}
                      style={selectedLicense === 'Trackouts (Stems)' ? { backgroundColor: '#2563eb', color: 'white' } : {}}
                      disabled={selectedLicense && selectedLicense !== 'Trackouts (Stems)'}
                    >
                      {selectedLicense === 'Trackouts (Stems)' ? 'Remover' : 'Anadir al carrito'}
                    </Button>
                  </article>

                  <article className="license-option">
                    <header>
                      <strong>Exclusive Rights</strong>
                      <span>Oferta</span>
                    </header>
                    <p>Derechos totales.</p>
                    <Button>Contactar</Button>
                  </article>
                </section>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  )
}