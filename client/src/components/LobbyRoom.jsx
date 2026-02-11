import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'

export default function LobbyRoom({ gameState, myId, emit, onLeave }) {
  const [topic, setTopic] = useState('')
  const [topicError, setTopicError] = useState('')
  const [players, setPlayers] = useState(gameState.players)
  const isHost = gameState.players.find(p => p.id === myId)?.isHost
  const selectedImposter = gameState.players.find(p => p.isImposter)?.id
  const canStart = isHost && selectedImposter && topic.trim()

  // Keep local players in sync with server (but allow reordering locally)
  React.useEffect(() => {
    setPlayers(gameState.players)
  }, [gameState.players])

  const handleReorder = (newOrder) => {
    setPlayers(newOrder)
    emit('reorderPlayers', { newOrder: newOrder.map(p => p.id) })
  }

  const handleSelectImposter = (targetId) => {
    if (!isHost) return
    emit('selectImposter', { targetId })
  }

  const handleStartGame = () => {
    if (!topic.trim()) { setTopicError('Enter a secret topic!'); return }
    if (!selectedImposter) { setTopicError('Choose the imposter first!'); return }
    emit('startGame', { topic: topic.trim() })
  }

  return (
    <div className="min-h-screen relative z-10 p-4 flex flex-col gap-4 max-w-lg mx-auto pt-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative"
      >
        {/* Back Button */}
        <button
          onClick={onLeave}
          className="absolute left-0 top-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60 hover:text-white"
          title="Leave Room"
        >
          ← Back
        </button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="font-display text-3xl text-white" style={{ textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
            LOBBY
          </span>
          <span className="text-2xl">🎭</span>
        </div>

        {/* ROOM CODE */}
        <div className="bg-white/10 rounded-xl p-3 mb-2 inline-flex items-center gap-4 border border-white/20">
          <div className="text-left">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Room Code</p>
            <p className="text-3xl font-mono font-bold text-neon-yellow tracking-widest leading-none">
              {gameState?.id}
            </p>
          </div>

          <button
            onClick={async () => {
              const code = gameState?.id;
              if (!code) return;

              try {
                await navigator.clipboard.writeText(code);
                console.log("Copied:", code);
              } catch (err) {
                // Fallback for unsupported browsers
                const textarea = document.createElement("textarea");
                textarea.value = code;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                console.log("Copied (fallback):", code);
              }
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Copy Code"
          >
            📋
          </button>
        </div>

        <p className="text-white/40 text-sm">
          {players.length} {players.length === 1 ? 'player' : 'players'} connected
        </p>
      </motion.div>

      {/* Waiting indicator */}
      {players.length < 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-3 px-4 rounded-xl"
          style={{ background: 'rgba(255,230,0,0.08)', border: '1px solid rgba(255,230,0,0.2)' }}
        >
          <p className="text-yellow-400 text-sm font-bold">
            ⚠️ Need at least 4 players to start!
            <span className="text-yellow-400/60 block font-normal text-xs mt-0.5">
              Share your IP with others on the same Wi-Fi
            </span>
          </p>
        </motion.div>
      )}

      {/* Players list */}
      <div className="game-card p-4">
        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">
          {isHost ? '⠿ Drag to reorder players' : '👥 Players'}
        </p>

        {isHost ? (
          <Reorder.Group axis="y" values={players} onReorder={handleReorder} className="space-y-2">
            {players.map((player, index) => (
              <Reorder.Item key={player.id} value={player}>
                <div className={`
                  flex items-center gap-3 p-3 rounded-2xl border cursor-grab active:cursor-grabbing transition-all duration-200
                  ${player.isImposter
                    ? 'game-card-neon-pink'
                    : player.id === myId
                      ? 'game-card-neon-cyan'
                      : 'game-card'
                  }
                `}>
                  <span className="text-white/30 text-lg select-none">⠿</span>

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-white/5">
                    {player.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate text-sm">{player.name}</span>
                      {player.id === myId && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">You</span>
                      )}
                      {player.isHost && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/30">👑 Host</span>
                      )}
                    </div>
                    <p className="text-white/30 text-xs font-mono">#{index + 1}</p>
                  </div>

                  <motion.button
                    disabled={player.isHost || players.length < 3}
                    style={{ cursor: (player.isHost || players.length < 3) ? "not-allowed" : "pointer" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); handleSelectImposter(player.isImposter ? null : player.id) }}
                    className={`
                      flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                      ${player.isImposter
                        ? 'bg-pink-500/30 border-pink-500/50 text-pink-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                      }
                    `}
                  >
                    {player.isImposter ? '😈 Chosen' : 'Set 😈'}
                  </motion.button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-2">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center gap-3 p-3 rounded-2xl border
                  ${player.id === myId ? 'game-card-neon-cyan' : 'game-card'}
                `}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl bg-white/5">
                  {player.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{player.name}</span>
                    {player.id === myId && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">You</span>
                    )}
                    {player.isHost && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/30">👑 Host</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Host controls */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-card p-4 space-y-4"
        >
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider">
            🔐 Secret Topic (only you & players will see)
          </p>
          <div>
            <input
              className="neon-input"
              placeholder="e.g. Watermelon, Eiffel Tower, Chess..."
              value={topic}
              onChange={e => { setTopic(e.target.value); setTopicError('') }}
              maxLength={50}
            />
            {topicError && (
              <p className="text-red-400 text-sm mt-1 font-bold">⚠️ {topicError}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${selectedImposter ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-white/50">
              {selectedImposter ? `Imposter selected ✓` : 'No imposter selected'}
            </span>
          </div>

          <motion.button
            onClick={handleStartGame}
            disabled={!canStart || players.length < 3}
            className="btn-primary w-full text-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            whileHover={canStart && players.length >= 3 ? { scale: 1.02 } : {}}
            whileTap={canStart && players.length >= 3 ? { scale: 0.97 } : {}}
          >
            {players.length < 3 ? '⏳ Waiting for players...' : '🚀 Start Game!'}
          </motion.button>
        </motion.div>
      )}

      {!isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-white/40 text-sm mt-2">Waiting for host to start the game...</p>
        </motion.div>
      )}
    </div>
  )
}
