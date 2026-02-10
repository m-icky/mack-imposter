import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sounds } from '../utils/sounds'

export default function CountdownOverlay({ roleReveal, onComplete }) {
  const [count, setCount] = useState(null)
  const [showRole, setShowRole] = useState(true)

  useEffect(() => {
    // Show role for 2.5s then countdown
    const roleTimer = setTimeout(() => {
      setShowRole(false)
      setCount(5)
    }, 2500)

    return () => clearTimeout(roleTimer)
  }, [])

  useEffect(() => {
    if (count === null) return
    if (count > 0) {
      sounds.countdownBeep(count)
      const timer = setTimeout(() => setCount(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      sounds.go()
      onComplete?.()
    }
  }, [count])

  const isImposter = roleReveal?.role === 'imposter'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        style={{
          background: isImposter
            ? 'radial-gradient(ellipse at center, rgba(255,45,120,0.25) 0%, rgba(10,10,15,0.97) 70%)'
            : 'radial-gradient(ellipse at center, rgba(0,245,255,0.15) 0%, rgba(10,10,15,0.97) 70%)',
        }}
      />

      <AnimatePresence mode="wait">
        {showRole ? (
          <motion.div
            key="role"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative z-10 text-center max-w-sm px-6"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-8xl mb-6"
            >
              {isImposter ? '😈' : '🕵️'}
            </motion.div>

            {isImposter ? (
              <>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-5xl text-white mb-3"
                  style={{ textShadow: '0 0 30px rgba(255,45,120,0.8)' }}
                >
                  YOU ARE THE
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="font-display text-6xl"
                  style={{
                    background: 'linear-gradient(135deg, #FF2D78, #BF5AF2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 20px rgba(255,45,120,0.6))',
                  }}
                >
                  IMPOSTER!
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/60 mt-4 text-lg font-body"
                >
                  Listen carefully & blend in... 🎭
                  <br />
                  <span className="text-white/40 text-sm">You don't know the secret topic!</span>
                </motion.p>
              </>
            ) : (
              <>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-4xl text-white mb-3"
                  style={{ textShadow: '0 0 20px rgba(0,245,255,0.5)' }}
                >
                  YOU ARE INNOCENT
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="game-card-neon-cyan p-4 rounded-2xl mt-4"
                >
                  <p className="text-white/50 text-sm uppercase tracking-wider mb-1">Secret Topic</p>
                  <p
                    className="font-display text-3xl text-white"
                    style={{ textShadow: '0 0 20px rgba(0,245,255,0.5)' }}
                  >
                    {roleReveal?.topic}
                  </p>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-white/50 text-sm mt-3"
                >
                  Give clues without revealing it! 🤫
                </motion.p>
              </>
            )}
          </motion.div>
        ) : count > 0 ? (
          <motion.div
            key={`count-${count}`}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="relative z-10 text-center"
          >
            <div className="countdown-num">{count}</div>
            <p className="text-white/40 font-display text-xl mt-2 tracking-widest">
              GET READY
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="relative z-10 text-center"
          >
            <div
              className="font-display"
              style={{
                fontSize: 'clamp(80px, 20vw, 160px)',
                background: 'linear-gradient(135deg, #39FF14, #00F5FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(57,255,20,0.6))',
              }}
            >
              GO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
