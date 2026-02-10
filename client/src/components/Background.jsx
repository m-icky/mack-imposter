import React, { useMemo } from 'react'

const EMOJIS = ['😈', '🔍', '🎭', '🃏', '❓', '⭐', '💀', '🔮', '👁️', '🌀']
const COLORS = ['#FF2D78', '#00F5FF', '#FFE600', '#39FF14', '#BF5AF2']

export default function Background() {
  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: Math.random() > 0.6 ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : null,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 12 + 6,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 15,
    }))
  }, [])

  return (
    <>
      <div className="grid-overlay" />
      <div className="bg-particles">
        {particles.map(p => (
          p.emoji ? (
            <span
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                fontSize: `${p.size + 8}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                animation: `floatParticle ${p.duration}s linear ${p.delay}s infinite`,
                opacity: 0.08,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {p.emoji}
            </span>
          ) : (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                animation: `floatParticle ${p.duration}s linear ${p.delay}s infinite`,
              }}
            />
          )
        ))}
      </div>
    </>
  )
}
