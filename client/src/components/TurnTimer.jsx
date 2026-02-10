import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sounds } from '../utils/sounds'

/**
 * TurnTimer
 * Props:
 *   deadline  — Unix ms timestamp when the turn expires (from server)
 *   total     — total duration in ms (for calculating %)
 *   urgent    — seconds threshold below which the bar turns red (default 5)
 *   label     — optional label text
 *   isActive  — only tick/play sounds when true
 */
export default function TurnTimer({ deadline, total, urgent = 5, label, isActive = true }) {
  const [remaining, setRemaining] = useState(null)
  const lastTickRef = useRef(null)

  useEffect(() => {
    if (!deadline) { setRemaining(null); return }

    const tick = () => {
      const now = Date.now()
      const left = Math.max(0, deadline - now)
      const secs = Math.ceil(left / 1000)

      setRemaining(left)

      // Play tick sound at 5, 4, 3, 2, 1
      if (isActive && secs <= 5 && secs > 0 && secs !== lastTickRef.current) {
        sounds.tick()
        lastTickRef.current = secs
      }
    }

    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [deadline, isActive])

  if (remaining === null || !deadline) return null

  const pct = Math.max(0, Math.min(100, (remaining / total) * 100))
  const secs = Math.ceil(remaining / 1000)
  const isUrgent = secs <= urgent

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/40 text-xs font-bold uppercase tracking-wider">{label}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={secs}
              initial={{ scale: isUrgent ? 1.4 : 1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`font-mono font-bold text-sm tabular-nums ${
                isUrgent ? 'text-red-400' : 'text-white/60'
              }`}
            >
              {secs}s
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isUrgent
              ? 'linear-gradient(90deg, #FF2D78, #FF8C00)'
              : 'linear-gradient(90deg, #00F5FF, #0099aa)',
            width: `${pct}%`,
            boxShadow: isUrgent
              ? '0 0 8px rgba(255,45,120,0.6)'
              : '0 0 8px rgba(0,245,255,0.4)',
          }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  )
}
