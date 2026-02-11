import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRandomTopic } from '../utils/topics'

export default function LobbyRoom({ gameState, myId, emit, onLeave }) {
  const [topic, setTopic] = useState('')
  const [topicError, setTopicError] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const isHost = gameState.players.find(p => p.id === myId)?.isHost
  const canStart = isHost && topic.trim() && gameState.players.length >= 4

  const handleRandomTopic = () => {
    const randomTopic = getRandomTopic()
    setTopic(randomTopic)
    setTopicError('')
  }

  const handleUpdateSetting = (key, value) => {
    const newSettings = { ...gameState.settings, [key]: value };
    emit('updateSettings', newSettings);
  };

  const settings = gameState.settings || {
    clueTimeout: 30,
    voteTimeout: 20,
    totalRounds: 3,
    imposterCount: 1
  };

  const handleStartGame = () => {
    console.log('🎮 Start Game clicked!', { topic, playerCount: gameState.players.length, isHost })
    if (!topic.trim()) {
      setTopicError('Enter a topic or click Random!');
      return
    }
    if (gameState.players.length < 4) {
      setTopicError('Need at least 4 players!');
      return
    }
    console.log('✅ Emitting startGame event with topic:', topic.trim())
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

          {isHost && (
            <motion.button
              onClick={() => setIsSettingsOpen(true)}
              whileHover={{ rotate: 90 }}
              className="absolute right-0 top-0 ml-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60 hover:text-white"
              title="Game Settings"
            >
              ⚙️
            </motion.button>
          )}
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
          {gameState.players.length} {gameState.players.length === 1 ? 'player' : 'players'} connected
        </p>
      </motion.div>

      {/* Waiting indicator */}
      {gameState.players.length < 4 && (
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
          👥 Players
        </p>

        <div className="space-y-2">
          {gameState.players.map((player, index) => (
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
                <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* Host controls */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-card p-4 space-y-6"
        >
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider">
            🔐 Secret Topic (only you & players will see)
          </p>
          <div className="flex gap-2">
            <input
              className="neon-input flex-1"
              placeholder="e.g. Watermelon, Eiffel Tower, Chess..."
              value={topic}
              onChange={e => { setTopic(e.target.value); setTopicError('') }}
              maxLength={50}
            />
            <motion.button
              onClick={handleRandomTopic}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-sm hover:bg-purple-500/30 transition-colors"
              title="Get random topic"
            >
              🎲 Random
            </motion.button>
          </div>
          {topicError && (
            <p className="text-red-400 text-sm mt-1 font-bold">⚠️ {topicError}</p>
          )}

          <motion.button
            onClick={handleStartGame}
            disabled={!canStart || gameState.players.length < 4}
            className="btn-primary w-full text-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            whileHover={canStart && gameState.players.length >= 4 ? { scale: 1.02 } : {}}
            whileTap={canStart && gameState.players.length >= 4 ? { scale: 0.97 } : {}}
          >
            {gameState.players.length < 4 ? '⏳ Waiting for players...' : '🚀 Start Game!'}
          </motion.button>
        </motion.div>
      )}

      {/* Waiting indicator for non-hosts */}
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

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="game-card w-full max-w-sm relative z-10 p-6 space-y-6 overflow-hidden"
              style={{ border: '1px solid rgba(0,245,255,0.3)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-xl text-white flex items-center gap-2">
                  <span className="text-neon-cyan">⚙️</span> Game Settings
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5">
                {/* Clue Timeout */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Clue Typing Time</label>
                    <span className="text-sm font-mono font-bold text-neon-cyan">{settings.clueTimeout}s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleUpdateSetting('clueTimeout', Math.max(15, settings.clueTimeout - 5))} className="flex-1 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors">-</button>
                    <button onClick={() => handleUpdateSetting('clueTimeout', Math.min(60, settings.clueTimeout + 5))} className="flex-1 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors">+</button>
                  </div>
                </div>

                {/* Vote Timeout */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Voting Time</label>
                    <span className="text-sm font-mono font-bold text-neon-cyan">{settings.voteTimeout}s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleUpdateSetting('voteTimeout', Math.max(10, settings.voteTimeout - 5))} className="flex-1 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors">-</button>
                    <button onClick={() => handleUpdateSetting('voteTimeout', Math.min(45, settings.voteTimeout + 5))} className="flex-1 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors">+</button>
                  </div>
                </div>

                {/* Total Rounds */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Total Rounds</label>
                    <span className="text-sm font-mono font-bold text-neon-cyan">{settings.totalRounds}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleUpdateSetting('totalRounds', Math.max(1, settings.totalRounds - 1))} className="flex-1 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors">-</button>
                    <button onClick={() => handleUpdateSetting('totalRounds', Math.min(6, settings.totalRounds + 1))} className="flex-1 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors">+</button>
                  </div>
                </div>

                {/* Imposter Count logic: 1 per 4 players */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Imposters</label>
                    <span className="text-[10px] text-white/50 italic">(1 per 4 players, Host excluded)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map(count => {
                      const isPlayable = gameState.players.length >= count * 4;
                      const isActive = settings.imposterCount === count;

                      return (
                        <button
                          key={count}
                          disabled={!isPlayable}
                          onClick={() => handleUpdateSetting('imposterCount', count)}
                          className={`
                            flex-1 h-10 rounded-xl text-xs font-bold transition-all border
                            ${isActive
                              ? (count === 1 ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'bg-pink-500/20 border-pink-400 text-pink-400')
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}
                            ${!isPlayable ? 'cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          title={!isPlayable ? `Need ${count * 4} players` : ""}
                        >
                          {count} 😈
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-sm text-black shadow-lg shadow-cyan-500/20"
              >
                Done
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
