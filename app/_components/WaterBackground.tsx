'use client'

import Water from './Water'

type WaterBackgroundProps = {
  speed: number
  depth: number
  clarity: number
  waves: number
  reflection: number
}

export default function WaterBackground({ speed, depth, clarity, waves, reflection }: WaterBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-10] overflow-hidden" aria-hidden="true">
      <Water speed={speed} depth={depth} clarity={clarity} waves={waves} reflection={reflection} />
    </div>
  )
}
