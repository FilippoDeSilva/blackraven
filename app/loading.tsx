'use client'

import { Lock, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative w-32 h-32">
        {/* Pulsing glow around center lock */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 blur-2xl opacity-30"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Orbiting shields */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `rotate(${i * 72}deg) translate(5rem)`,
            }}
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 10 - i,
              ease: 'linear',
            }}
          >
            <Shield className="w-5 h-5 text-rose-400 dark:text-purple-400 opacity-80" />
          </motion.div>
        ))}

        {/* Central lock */}
        <div className="flex items-center justify-center w-full h-full">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: 'easeInOut',
            }}
            className="text-rose-500 dark:text-purple-400"
          >
            <Lock className="w-10 h-10 drop-shadow-md" />
          </motion.div>
        </div>
      </div>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute bottom-20 text-sm text-gray-500 dark:text-gray-400 tracking-wide"
      >
        Encrypting your experience...
      </motion.p>
    </div>
  )
}
