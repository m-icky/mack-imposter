import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TurnIndicator({ currentPlayer, round, totalRounds, isMyTurn }) {
  if (!currentPlayer) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Round indicator */}
      <div className="flex items-center gap-3">
        <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Round</span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalRounds }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < round
                  ? 'bg-cyan-400 w-6'
                  : i === round - 1
                  ? 'bg-cyan-400 w-4'
                  : 'bg-white/15 w-4'
              }`}
            />
          ))}
        </div>
        <span
          className="font-display text-sm"
          style={{ color: '#00F5FF', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}
        >
          {round}/{totalRounds}
        </span>
      </div>

      {/* Turn indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPlayer.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, type: 'spring', damping: 20 }}
          className={`
            flex items-center gap-3 p-3 rounded-2xl
            ${isMyTurn
              ? 'game-card-neon-cyan'
              : 'game-card'
            }
          `}
        >
          <div className={`
            w-8 h-8 rounded-xl flex items-center justify-center text-xl flex-shrink-0
            ${isMyTurn ? 'ring-2 ring-cyan-400/60 ring-active' : ''}
          `}>
            {currentPlayer.avatar}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isMyTurn ? 'text-cyan-300' : 'text-white'}`}>
                {isMyTurn ? 'Your turn!' : currentPlayer.name + "'s turn"}
              </span>
              {isMyTurn && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-sm"
                >
                  ✍️
                </motion.span>
              )}
            </div>
            <p className="text-white/30 text-xs">
              {isMyTurn ? 'Give a clue about the topic!' : 'Waiting for their clue...'}
            </p>
          </div>

          {isMyTurn && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
