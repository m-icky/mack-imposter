import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sounds } from '../utils/sounds'

function Confetti({ count = 40 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#FF2D78', '#00F5FF', '#FFE600', '#39FF14', '#BF5AF2'][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 6,
    delay: Math.random() * 0.8,
    duration: Math.random() * 1.5 + 1.5,
    rotation: Math.random() * 720 - 360,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, background: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: p.rotation }}
          transition={{ delay: p.delay, duration: p.duration, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

export default function ResultPopup({ gameState, myId, emit }) {
  const result = gameState.result
  const [phase, setPhase] = useState('reveal') // reveal | details
  const isHost = gameState.players.find(p => p.id === myId)?.isHost

  useEffect(() => {
    if (result?.win === 'players') {
      sounds.playersWin()
    } else {
      sounds.imposterWins()
    }

    const timer = setTimeout(() => setPhase('details'), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!result) return null

  const playersWin = result.win === 'players'
  const imposterPlayer = gameState.players.find(p => p.isImposter)

  // Build vote tally display
  const tallied = gameState.players.map(p => ({
    ...p,
    votes: Object.values(gameState.votes || {}).filter(v => v === p.id).length,
  })).sort((a, b) => b.votes - a.votes)

  return (
    <div className={`min-h-screen relative flex flex-col items-center justify-center p-4 z-10 ${playersWin ? 'result-players-win' : 'result-imposter-wins'}`}>

      {playersWin && phase === 'details' && <Confetti count={50} />}

      <AnimatePresence mode="wait">
        {phase === 'reveal' ? (
          <motion.div
            key="reveal"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0, filter: 'blur(30px)' }}
            transition={{ type: 'spring', damping: 12, stiffness: 150 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="text-9xl mb-6"
            >
              {playersWin ? '🎉' : '😈'}
            </motion.div>
            <motion.div
              className="font-display text-5xl md:text-7xl"
              style={playersWin
                ? { background: 'linear-gradient(135deg, #39FF14, #00F5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 30px rgba(57,255,20,0.6))' }
                : { background: 'linear-gradient(135deg, #FF2D78, #BF5AF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 30px rgba(255,45,120,0.6))' }
              }
            >
              {playersWin ? 'PLAYERS WIN!' : 'IMPOSTER WINS!'}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg space-y-4"
          >
            {/* Result banner */}
            <div className={`
              p-5 rounded-3xl text-center border
              ${playersWin
                ? 'bg-green-500/10 border-green-500/25'
                : 'bg-pink-500/10 border-pink-500/25'
              }
            `}>
              <div className="text-5xl mb-3">{playersWin ? '🎉' : '😈'}</div>
              <div
                className="font-display text-4xl mb-2"
                style={playersWin
                  ? { color: '#39FF14', textShadow: '0 0 20px rgba(57,255,20,0.5)' }
                  : { color: '#FF2D78', textShadow: '0 0 20px rgba(255,45,120,0.5)' }
                }
              >
                {playersWin ? 'PLAYERS WIN!' : 'IMPOSTER WINS!'}
              </div>
              <p className="text-white/60 text-sm">
                {playersWin
                  ? 'The crowd correctly identified the imposter!'
                  : 'The imposter fooled everyone and escaped!'}
              </p>
            </div>

            {/* Imposter reveal */}
            <div className="game-card p-4">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">The Imposter Was...</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-4xl bg-pink-500/15 border border-pink-500/30">
                  {imposterPlayer?.avatar || '😈'}
                </div>
                <div>
                  <p className="font-bold text-2xl text-white">{result.imposterName}</p>
                  <p className="text-white/40 text-sm mt-0.5">
                    Topic was: <span className="text-cyan-400 font-bold">{result.topic}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Vote tally */}
            <div className="game-card p-4">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Vote Tally</p>
              <div className="space-y-2">
                {tallied.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="text-xl w-8 text-center">{player.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${player.isImposter ? 'text-pink-400' : 'text-white'}`}>
                          {player.id === myId ? 'You' : player.name}
                          {player.isImposter && ' 😈'}
                        </span>
                        <span className="text-white/50 text-xs font-mono">{player.votes} vote{player.votes !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full bg-white/8 rounded-full h-1.5">
                        <motion.div
                          className={`h-1.5 rounded-full ${player.isImposter ? 'bg-pink-500' : 'bg-cyan-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(player.votes / (gameState.players.length - 1)) * 100}%` }}
                          transition={{ delay: i * 0.07 + 0.3, duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isHost && (
                <motion.button
                  onClick={() => emit('restartGame', {})}
                  className="btn-primary flex-1 text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  🔄 Play Again!
                </motion.button>
              )}
              {!isHost && (
                <div className="flex-1 text-center py-3 text-white/40 text-sm">
                  Waiting for host to restart...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
