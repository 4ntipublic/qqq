'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const appleSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 32,
  mass: 1,
  bounce: 0,
}

export default function AdminDashboardTemplate({
  children,
}: {
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={appleSpring}
      className="min-h-full"
    >
      {children}
    </motion.div>
  )
}
