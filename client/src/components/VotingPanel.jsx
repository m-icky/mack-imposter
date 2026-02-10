import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sounds } from '../utils/sounds'

export default function VotingPanel({ gameState, myId, emit }) {
  const [selectedVote, setSelectedVote] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showDrumroll, setShowDrumroll] = useState(false)
  const myPlayer = gameState.players.find(p => p.id === myId)
  const votedCount = gameState.players.filter(p => p.hasVoted).length
  const totalPlayers = gameState.players.length
  const allVoted = votedCount === totalPlayers

  useEffect(() => {
    if (allVoted) {
      sounds.drumroll()
      setShowDrumroll(true)
    }
  }, [allVoted])

  const handleVote = (targetId) => {
    if (submitted || myPlayer?.hasVoted) return
    setSelectedVote(targetId)
  }

  const handleSubmitVote = () => {
    if (!selectedVote || submitted || myPlayer?.hasVoted) return
    sounds.vote()
    setSubmitted(true)
    emit('submitVote', { targetId: selectedVote })
  }

  const hasVoted = myPlayer?.hasVoted || submitted

  return (
    <div className="min-h-screen relative z-10 flex flex-col max-w-lg mx-auto p-4 pt-5 gap-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-5xl mb-3"
        >
          🗳️
        </motion.div>
        <h2
          className="font-display text-4xl text-white mb-1"
          style={{ textShadow: '0 0 20px rgba(255,230,0,0.4)' }}
        >
          VOTE!
        </h2>
        <p className="text-white/50 text-sm">Who is the Imposter? 🤔</p>
      </motion.div>

      {/* Vote progress */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Votes Cast</span>
          <span className="font-display text-sm" style={{ color: '#FFE600' }}>
            {votedCount}/{totalPlayers}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ background: 'linear-gradient(90deg, #FFE600, #FF8C00)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(votedCount / totalPlayers) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {gameState.players.map(player => (
            <div
              key={player.id}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                ${player.hasVoted
                  ? 'bg-green-500/15 border border-green-500/25 text-green-400'
                  : 'bg-white/5 border border-white/10 text-white/30'
                }
              `}
            >
              <span>{player.avatar}</span>
              <span>{player.id === myId ? 'You' : player.name.split(' ')[0]}</span>
              {player.hasVoted && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Drumroll text */}
      <AnimatePresence>
        {showDrumroll && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="font-display text-xl text-yellow-400"
              style={{ textShadow: '0 0 20px rgba(255,230,0,0.6)' }}
            >
              🥁 All votes are in! 🥁
            </motion.p>
            <p className="text-white/40 text-sm mt-1">Revealing results...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player vote cards */}
      {!hasVoted ? (
        <div className="flex-1">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">
            Select who you think is the Imposter:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {gameState.players.map((player, index) => {
              // Can't vote for yourself
              const isSelf = player.id === myId
              const isSelected = selectedVote === player.id

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.07, type: 'spring', damping: 15 }}
                  onClick={() => !isSelf && handleVote(player.id)}
                  className={`
                    vote-card p-4 rounded-2xl border text-center cursor-pointer select-none
                    ${isSelf ? 'opacity-40 cursor-not-allowed' : ''}
                    ${isSelected ? 'selected' : 'game-card'}
                  `}
                >
                  <div
                    className={`
                      w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-3xl
                      ${isSelected ? 'bg-cyan-500/20' : 'bg-white/5'}
                    `}
                  >
                    {player.avatar}
                  </div>
                  <p className={`font-bold text-sm truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {isSelf ? 'You' : player.name}
                  </p>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-1"
                    >
                      <span className="text-xs text-cyan-400 font-bold">Selected</span>
                    </motion.div>
                  )}
                  {isSelf && <p className="text-xs text-white/30 mt-1">Can't vote self</p>}
                </motion.div>
              )
            })}
          </div>

          <motion.button
            onClick={handleSubmitVote}
            disabled={!selectedVote}
            className="btn-primary w-full text-lg mt-4 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            whileHover={selectedVote ? { scale: 1.02 } : {}}
            whileTap={selectedVote ? { scale: 0.97 } : {}}
          >
            {selectedVote ? '🗳️ Submit Vote!' : 'Select a player first'}
          </motion.button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-5xl mb-4"
          >
            ✅
          </motion.div>
          <p className="font-bold text-white text-xl mb-2">Vote submitted!</p>
          <p className="text-white/40 text-sm">
            {allVoted ? 'Tallying results...' : `Waiting for ${totalPlayers - votedCount} more vote${totalPlayers - votedCount !== 1 ? 's' : ''}...`}
          </p>

          {/* Show who hasn't voted */}
          {!allVoted && (
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              {gameState.players.filter(p => !p.hasVoted).map(p => (
                <span key={p.id} className="text-sm bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-white/50">
                  {p.avatar} {p.id === myId ? 'You' : p.name}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
