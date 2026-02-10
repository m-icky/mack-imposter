import React from 'react'
import { motion } from 'framer-motion'

export default function PlayerCard({
  player,
  index,
  isMe,
  isHost,
  gamePhase,
  selectedImposter,
  onSelectImposter,
  dragHandleProps = {},
  isDragging = false,
}) {
  const canSelectImposter = isHost && gamePhase === 'lobby'
  const isSelectedImposter = selectedImposter === player.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={`
        flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isSelectedImposter
          ? 'game-card-neon-pink glow-pink'
          : isMe
          ? 'game-card-neon-cyan'
          : 'game-card'
        }
      `}
    >
      {/* Drag handle (host only, lobby only) */}
      {canSelectImposter && (
        <span
          {...dragHandleProps}
          className="drag-handle text-xl flex-shrink-0 select-none"
          title="Drag to reorder"
        >
          ⠿
        </span>
      )}

      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
        ${isMe ? 'bg-cyan-900/40 ring-2 ring-cyan-400/40' : 'bg-white/5'}
      `}>
        {player.avatar}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white truncate text-sm md:text-base">
            {player.name}
          </span>
          {isMe && (
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
              You
            </span>
          )}
          {player.isHost && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/30">
              👑 Host
            </span>
          )}
        </div>
        <p className="text-white/30 text-xs font-mono">
          #{index + 1} in order
        </p>
      </div>

      {/* Imposter select button (host only) */}
      {canSelectImposter && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectImposter(isSelectedImposter ? null : player.id)}
          className={`
            flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
            ${isSelectedImposter
              ? 'bg-pink-500/30 border-pink-500/50 text-pink-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
            }
          `}
        >
          {isSelectedImposter ? '😈 Chosen' : 'Set 😈'}
        </motion.button>
      )}
    </motion.div>
  )
}
