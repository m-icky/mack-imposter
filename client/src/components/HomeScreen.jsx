import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function HomeScreen({ onJoin, connected }) {
  const [name, setName] = useState(() => localStorage.getItem('username') || '')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('name') // name | choice | join
  const [joining, setJoining] = useState(false)

  // Reset joining state whenever step changes or component remounts
  // This prevents the "Create Room" button from getting stuck as disabled
  useEffect(() => {
    setJoining(false)
  }, [step])

  const handleNameSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Enter your name!'); return }
    if (trimmed.length > 20) { setError('Name too long (max 20 chars)'); return }

    localStorage.setItem('username', trimmed)
    setStep('choice')
    setError('')
  }

  const handleHost = () => {
    if (!connected) { setError('Connecting to server...'); return }
    setJoining(true)
    setTimeout(() => onJoin({ name, action: 'create' }), 300)
  }

  const handleJoinSubmit = (e) => {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    if (code.length !== 4) { setError('Code must be 4 letters'); return }
    if (!connected) { setError('Connecting to server...'); return }

    setJoining(true)
    setTimeout(() => onJoin({ name, roomId: code, action: 'join' }), 300)
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
            Mack's
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
        </div>

        {/* Card */}
        <motion.div
          layout
          className="game-card p-6 md:p-8 relative overflow-hidden scanline-overlay"
        >
          <div className="absolute top-0 right-0 w-20 h-20 opacity-20"
            style={{ background: 'radial-gradient(circle at top right, #FF2D78, transparent)' }} />

          {/* STEP 1: NAME */}
          {step === 'name' && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
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
              </div>
              <motion.button
                type="submit"
                className="btn-primary w-full text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Next ➜
              </motion.button>
            </form>
          )}

          {/* STEP 2: CHOICE */}
          {step === 'choice' && (
            <div className="space-y-4">
              <p className="text-white/80 text-center mb-4">Welcome, <span className="text-neon-cyan font-bold">{name}</span>!</p>

              <motion.button
                onClick={handleHost}
                disabled={!connected || joining}
                className="btn-primary w-full text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Create Room
              </motion.button>

              <motion.button
                onClick={() => setStep('join')}
                disabled={!connected || joining}
                className="w-full text-lg py-3 px-6 rounded-xl font-display uppercase tracking-wider
                  bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Join Room
              </motion.button>

              <button
                onClick={() => setStep('name')}
                className="text-white/40 text-xs w-full hover:text-white/60 mt-2"
              >
                ← Back to Name
              </button>
            </div>
          )}

          {/* STEP 3: JOIN CODE */}
          {step === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm font-bold mb-2 uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  className="neon-input text-center uppercase tracking-[0.5em] font-mono text-2xl"
                  placeholder="ABCD"
                  value={roomCode}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                  maxLength={4}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('choice')}
                  className="px-4 py-3 bg-white/10 rounded-xl text-white/60 hover:bg-white/20"
                >
                  ←
                </button>
                <motion.button
                  type="submit"
                  className="btn-primary flex-1 text-lg"
                  disabled={!connected || joining}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {joining ? 'Joining...' : 'Enter Game'}
                </motion.button>
              </div>
            </form>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-400 text-sm mt-4 font-bold text-center"
            >
              ⚠️ {error}
            </motion.p>
          )}
        </motion.div>

        <p className="text-center text-white/20 text-xs mt-4 font-mono">
          {!connected ? 'Connecting...' : 'Connected to server'}
        </p>
      </motion.div>
    </div>
  )
}
