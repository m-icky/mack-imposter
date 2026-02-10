import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TurnTimer from './TurnTimer'
import { sounds } from '../utils/sounds'

const VOTE_TIMEOUT_MS = 20000

export default function VotingPanel({ gameState, myId, emit }) {
  const [selectedVote, setSelectedVote] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showDrumroll, setShowDrumroll] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const myPlayer = gameState.players.find(p => p.id === myId)
  const isHost = myPlayer?.isHost

  // Only players who are NOT host participate in voting
  const voters = gameState.players.filter(p => !p.isHost)

  const votedCount = voters.filter(p => p.hasVoted).length
  const totalPlayers = voters.length
  const allVoted = votedCount === totalPlayers
  const hasVoted = myPlayer?.hasVoted || submitted || isHost

  // Pending voter should ignore host
  const pendingVoter = voters.find(p => !p.hasVoted)
  const isMyVotePending = pendingVoter?.id === myId && !hasVoted

  useEffect(() => {
    if (allVoted && totalPlayers > 0) {
      sounds.drumroll()
      setShowDrumroll(true)
    }
  }, [allVoted, totalPlayers])

  const handleVote = (targetId) => {
    if (submitted || myPlayer?.hasVoted || isHost) return
    setSelectedVote(targetId)
  }

  const handleSubmitVote = () => {
    if (!selectedVote || submitted || myPlayer?.hasVoted || isHost) return
    sounds.vote()
    setSubmitted(true)
    emit('submitVote', { targetId: selectedVote })
  }

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return }
    emit('restartGame', {})
    setConfirmReset(false)
  }

  return (
    <div className="min-h-screen relative z-10 flex flex-col max-w-lg mx-auto p-4 pt-5 gap-5">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="text-center flex-1">
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
        </div>

        {/* Reset button (host only) */}
        {isHost && (
          <div className="flex-shrink-0 ml-2 mt-1">
            <AnimatePresence mode="wait">
              {!confirmReset ? (
                <motion.button
                  key="reset-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 text-white/50 hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400 transition-all"
                >
                  <span>🔄</span>
                  <span>Reset</span>
                </motion.button>
              ) : (
                <motion.div
                  key="reset-confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-1"
                >
                  <span className="text-xs text-red-400 font-bold text-center">Sure?</span>
                  <div className="flex gap-1">
                    <button onClick={handleReset} className="px-2 py-1.5 rounded-lg text-xs font-bold bg-red-500/25 border border-red-500/50 text-red-300">Yes</button>
                    <button onClick={() => setConfirmReset(false)} className="px-2 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/15 text-white/40">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Vote progress (excluding host) ── */}
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
            animate={{ width: `${totalPlayers ? (votedCount / totalPlayers) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Status chips (host shown but not part of voting logic) */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {gameState.players.map(player => (
            <div
              key={player.id}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                ${player.isHost
                  ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                  : player.hasVoted
                    ? 'bg-green-500/15 border border-green-500/25 text-green-400'
                    : pendingVoter?.id === player.id
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                      : 'bg-white/5 border border-white/10 text-white/30'
                }
              `}
            >
              <span>{player.avatar}</span>
              <span>
                {player.id === myId ? 'You' : player.name.split(' ')[0]}
                {player.isHost && ' (Host)'}
              </span>
              {!player.isHost && player.hasVoted && <span>✓</span>}
              {!player.isHost && pendingVoter?.id === player.id && !player.hasVoted && (
                <motion.span animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 0.8, repeat: Infinity }}>⏱</motion.span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Vote timer ── */}
      {!allVoted && gameState.voteDeadline && totalPlayers > 0 && (
        <motion.div
          key={pendingVoter?.id}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TurnTimer
            deadline={gameState.voteDeadline}
            total={VOTE_TIMEOUT_MS}
            urgent={7}
            label={
              isMyVotePending
                ? '⏱ Your time to vote!'
                : `⏱ Waiting for ${pendingVoter?.name ?? ''}...`
            }
            isActive={isMyVotePending}
          />
        </motion.div>
      )}

      {/* ── Drumroll ── */}
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

      {/* ── Vote cards (HOST DOES NOT VOTE & CANNOT BE VOTED) ── */}
      {!hasVoted && !isHost ? (
        <div className="flex-1">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">
            Select who you think is the Imposter:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {voters.map((player, index) => {
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
                  <div className={`w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-3xl ${isSelected ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                    {player.avatar}
                  </div>
                  <p className={`font-bold text-sm truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {isSelf ? 'You' : player.name}
                  </p>

                  {isSelected && (
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="mt-1">
                      <span className="text-xs text-cyan-400 font-bold">Selected ✓</span>
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
            {isHost ? '👑' : '✅'}
          </motion.div>

          <p className="font-bold text-white text-xl mb-2">
            {isHost ? 'Host does not vote' : 'Vote submitted!'}
          </p>

          {!isHost && (
            <p className="text-white/40 text-sm">
              {allVoted
                ? 'Tallying results...'
                : `Waiting for ${totalPlayers - votedCount} more vote${totalPlayers - votedCount !== 1 ? 's' : ''}...`
              }
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}