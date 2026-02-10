import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TurnIndicator from './TurnIndicator'
import TurnTimer from './TurnTimer'
import ChatBox from './ChatBox'

const CLUE_TIMEOUT_MS = 15000

export default function GameScreen({ gameState, myId, roleReveal, emit }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const currentPlayer = gameState.players[gameState.turnIndex]
  const isMyTurn = currentPlayer?.id === myId
  const myPlayer = gameState.players.find(p => p.id === myId)
  const isHost = myPlayer?.isHost

  const handleSend = (text) => {
    emit('sendMessage', { text })
  }

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return }
    emit('restartGame', {})
    setConfirmReset(false)
  }

  return (
    <div className="min-h-screen relative z-10 flex flex-col max-w-lg mx-auto p-4 pt-5 gap-4">

      {/* ── Header row ── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h2 className="font-display text-2xl text-white" style={{ textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>
            CLUE ROUND
          </h2>
          <p className="text-white/40 text-xs">
            {gameState.players.length} players · 3 rounds total
          </p>
        </div>

        {/* Player avatars */}
        <div className="flex -space-x-1 mr-2">
          {gameState.players.map((player, i) => (
            <div
              key={player.id}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${i === gameState.turnIndex ? 'border-cyan-400 scale-110 z-10' : 'border-dark-900 opacity-60'}
              `}
              style={{ background: 'rgba(255,255,255,0.08)', zIndex: i === gameState.turnIndex ? 10 : i }}
              title={player.name}
            >
              {player.avatar}
            </div>
          ))}
        </div>

        {/* ── Reset button (host only) ── */}
        {isHost && (
          <AnimatePresence mode="wait">
            {!confirmReset ? (
              <motion.button
                key="reset-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setConfirmReset(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 text-white/50 hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400 transition-all"
                title="Reset game to lobby"
              >
                <span>🔄</span>
                <span className="hidden sm:inline">Reset</span>
              </motion.button>
            ) : (
              <motion.div
                key="reset-confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 flex-shrink-0"
              >
                <span className="text-xs text-red-400 font-bold hidden sm:inline">Sure?</span>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/25 border border-red-500/50 text-red-300 hover:bg-red-500/35 transition-all"
                >
                  Yes ✓
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/15 text-white/40 hover:text-white/70 transition-all"
                >
                  Cancel ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Turn indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <TurnIndicator
          currentPlayer={currentPlayer}
          round={gameState.round}
          totalRounds={gameState.totalRounds}
          isMyTurn={isMyTurn}
        />
      </motion.div>

      {/* ── Clue timer bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <TurnTimer
          deadline={gameState.turnDeadline}
          total={CLUE_TIMEOUT_MS}
          urgent={5}
          label={isMyTurn ? '⏱ Your time to type a clue' : `⏱ ${currentPlayer?.name ?? ''}'s turn`}
          isActive={isMyTurn}
        />
      </motion.div>

      {/* ── Role reminder ── */}
      {roleReveal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`
            px-3 py-2 rounded-xl flex items-center gap-2 text-sm
            ${roleReveal.role === 'imposter'
              ? 'bg-pink-500/10 border border-pink-500/20'
              : 'bg-cyan-500/8 border border-cyan-500/15'
            }
          `}
        >
          <span>{roleReveal.role === 'imposter' ? '😈' : '🔐'}</span>
          <span className={roleReveal.role === 'imposter' ? 'text-pink-400' : 'text-cyan-400'}>
            {roleReveal.role === 'imposter'
              ? "You're the Imposter — blend in!"
              : `Topic: ${roleReveal.topic}`
            }
          </span>
        </motion.div>
      )}

      {/* ── Chat ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 flex flex-col min-h-0"
        style={{ minHeight: '380px' }}
      >
        <ChatBox
          messages={gameState.messages}
          currentPlayer={currentPlayer}
          myId={myId}
          isMyTurn={isMyTurn}
          onSend={handleSend}
          roleReveal={roleReveal}
        />
      </motion.div>

      {/* ── Turn order strip ── */}
      <div className="game-card p-3">
        <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-2">Turn Order</p>
        <div className="flex gap-2 flex-wrap">
          {gameState.players.map((player, i) => (
            <div
              key={player.id}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold transition-all
                ${i === gameState.turnIndex
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : player.id === myId
                  ? 'bg-white/8 border border-white/15 text-white/70'
                  : 'bg-white/4 border border-white/8 text-white/40'
                }
              `}
            >
              <span>{player.avatar}</span>
              <span>{player.id === myId ? 'You' : player.name.split(' ')[0]}</span>
              {i === gameState.turnIndex && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-xs"
                >
                  ●
                </motion.span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
