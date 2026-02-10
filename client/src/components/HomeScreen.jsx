import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function HomeScreen({ onJoin, connected }) {
  const [name, setName] = useState(() => localStorage.getItem('rsgp_username') || '')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Enter your name!'); return }
    if (trimmed.length > 20) { setError('Name too long (max 20 chars)'); return }
    if (!connected) { setError('Connecting to server...'); return }
    localStorage.setItem('rsgp_username', trimmed)
    setJoining(true)
    setTimeout(() => onJoin(trimmed), 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="text-7xl mb-4 inline-block"
          >
            😈
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl md:text-6xl text-white mb-1"
            style={{ textShadow: '0 0 30px rgba(255,45,120,0.5), 0 0 60px rgba(255,45,120,0.2)' }}
          >
            RSGP
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="font-display text-3xl md:text-4xl"
            style={{
              background: 'linear-gradient(90deg, #00F5FF, #BF5AF2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            IMPOSTER
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-sm mt-3 font-body tracking-wide uppercase"
          >
            Social Deduction · Party Game
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="game-card p-6 md:p-8 relative overflow-hidden scanline-overlay"
        >
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-20"
            style={{ background: 'radial-gradient(circle at top right, #FF2D78, transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm font-bold mb-2 uppercase tracking-wider">
                Your Name
              </label>
              <input
                className="neon-input"
                placeholder="Enter your player name..."
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                maxLength={20}
                autoFocus
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm mt-2 font-bold"
                >
                  ⚠️ {error}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              className="btn-primary w-full text-lg"
              disabled={!connected || joining}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {!connected ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : joining ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </span>
              ) : (
                '🎮 Join Game'
              )}
            </motion.button>
          </form>

          {/* How to play */}
          <div className="mt-6 pt-5 border-t border-white/8">
            <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-3">How to Play</p>
            <div className="space-y-2 text-white/50 text-sm">
              <div className="flex gap-2 items-start">
                <span className="text-base">🕵️</span>
                <p>One player is secretly chosen as the <span className="text-neon-pink font-bold">Imposter</span></p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-base">💬</span>
                <p>Players give clues about a secret topic — <em>the Imposter doesn't know it!</em></p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-base">🗳️</span>
                <p>After 3 rounds, everyone votes to expose the Imposter</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/20 text-xs mt-4 font-mono"
        >
          Works on local Wi-Fi · No account needed
        </motion.p>
      </motion.div>
    </div>
  )
}
