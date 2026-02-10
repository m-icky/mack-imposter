import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sounds } from '../utils/sounds'

const EMOJI_REACTIONS = ['😂', '🤔', '😱', '👀', '🔥', '❓', '💯', '🙈']

export default function ChatBox({ messages, currentPlayer, myId, isMyTurn, onSend, roleReveal }) {
  const [input, setInput] = useState('')
  const [lastCount, setLastCount] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (messages.length > lastCount) {
      sounds.messageIn()
      setLastCount(messages.length)
    }
  }, [messages])

  // Focus input when it's my turn
  useEffect(() => {
    if (isMyTurn) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isMyTurn])

  const handleSend = (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || !isMyTurn) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupMessages = (msgs) => {
    // Group consecutive messages from the same sender
    return msgs
  }

  const isImposter = roleReveal?.role === 'imposter'

  return (
    <div className="game-card flex flex-col h-full min-h-0">
      {/* Secret topic reminder (non-imposters) */}
      {roleReveal && !isImposter && (
        <div className="p-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider">🔐 Topic:</span>
            <span
              className="font-bold text-sm"
              style={{ color: '#00F5FF', textShadow: '0 0 10px rgba(0,245,255,0.4)' }}
            >
              {roleReveal.topic}
            </span>
            <span className="text-xs text-white/30 ml-auto">(secret)</span>
          </div>
        </div>
      )}

      {isImposter && (
        <div className="p-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FF2D78' }}>
              😈 You are the Imposter
            </span>
            <span className="text-xs text-white/30 ml-auto">Blend in!</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: '320px' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center py-8">
            <div>
              <div className="text-4xl mb-2">💬</div>
              <p className="text-white/30 text-sm">
                {isMyTurn ? 'You go first! Give a clue...' : 'Waiting for first clue...'}
              </p>
            </div>
          </div>
        ) : (
        messages.map((msg, index) => {
            const isMe = msg.playerId === myId
            const isSystem = msg.isSystem

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center gap-2 py-1"
                >
                  <div className="flex-1 h-px bg-orange-500/20" />
                  <span className="text-xs text-orange-400/70 font-bold px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 whitespace-nowrap">
                    {msg.playerAvatar} {msg.playerName} — {msg.text}
                  </span>
                  <div className="flex-1 h-px bg-orange-500/20" />
                </motion.div>
              )
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-base bg-white/5 self-end"
                  title={msg.playerName}
                >
                  {msg.playerAvatar}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-white/30 text-xs px-1">
                    {isMe ? 'You' : msg.playerName}
                    <span className="ml-1 text-white/15">R{msg.round}</span>
                  </span>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm font-body font-semibold break-words ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={isMe
                      ? { background: 'rgba(0, 245, 255, 0.15)', border: '1px solid rgba(0,245,255,0.2)', color: '#e0fdff' }
                      : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji quick reactions */}
      <div className="px-3 py-1.5 border-t border-white/5 flex gap-1 overflow-x-auto">
        {EMOJI_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => isMyTurn && handleSend(emoji)}
            disabled={!isMyTurn}
            className="text-lg hover:scale-125 transition-transform duration-100 disabled:opacity-30 flex-shrink-0 px-1"
            title={isMyTurn ? `Send ${emoji}` : 'Not your turn'}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 pt-2">
        <div className={`
          flex gap-2 rounded-2xl p-1 transition-all duration-200
          ${isMyTurn
            ? 'bg-white/5 border border-cyan-500/30'
            : 'bg-white/3 border border-white/8'
          }
        `}>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/25 outline-none font-body"
            placeholder={isMyTurn ? 'Give your clue...' : `Waiting for ${currentPlayer?.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isMyTurn}
            maxLength={80}
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!isMyTurn || !input.trim()}
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all
              ${isMyTurn && input.trim()
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
                : 'bg-white/5 text-white/20'
              }
            `}
            whileHover={isMyTurn && input.trim() ? { scale: 1.1 } : {}}
            whileTap={isMyTurn && input.trim() ? { scale: 0.9 } : {}}
          >
            ↑
          </motion.button>
        </div>
      </div>
    </div>
  )
}
