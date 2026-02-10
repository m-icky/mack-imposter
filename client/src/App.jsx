import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Background from './components/Background'
import HomeScreen from './components/HomeScreen'
import LobbyRoom from './components/LobbyRoom'
import GameScreen from './components/GameScreen'
import CountdownOverlay from './components/CountdownOverlay'
import VotingPanel from './components/VotingPanel'
import ResultPopup from './components/ResultPopup'
import { useSocket } from './hooks/useSocket'
import { sounds } from './utils/sounds'

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.97, y: 10 },
  in: { opacity: 1, scale: 1, y: 0 },
  out: { opacity: 0, scale: 1.03, y: -10 },
}
const pageTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] }

export default function App() {
  const { connected, gameState, roleReveal, emit, getSocketId } = useSocket()
  const [joined, setJoined] = useState(false)
  const [myName, setMyName] = useState('')
  const [showCountdown, setShowCountdown] = useState(false)
  const [prevPhase, setPrevPhase] = useState(null)
  const prevPlayersCount = useRef(0)

  // Get own socket ID (may not be stable on first render)
  const [myId, setMyId] = useState(null)

  // Track socket ID
  useEffect(() => {
    const interval = setInterval(() => {
      const id = getSocketId()
      if (id && id !== myId) setMyId(id)
    }, 100)
    return () => clearInterval(interval)
  }, [myId, getSocketId])

  // Handle phase transitions
  useEffect(() => {
    if (!gameState) return

    // Show countdown when entering countdown phase
    if (gameState.phase === 'countdown' && prevPhase !== 'countdown') {
      setShowCountdown(true)
    }

    // Hide countdown when game starts
    if (gameState.phase === 'game' && prevPhase === 'countdown') {
      // Let CountdownOverlay handle its own completion
    }

    // Play sounds on player join
    if (gameState.players.length > prevPlayersCount.current) {
      if (joined) sounds.join()
      prevPlayersCount.current = gameState.players.length
    }

    setPrevPhase(gameState.phase)
  }, [gameState?.phase, gameState?.players?.length])

  const handleJoin = (name) => {
    setMyName(name)
    setJoined(true)
    emit('join', { name })
  }

  const handleCountdownComplete = () => {
    setShowCountdown(false)
  }

  // Determine what to render
  const renderScreen = () => {
    if (!joined || !gameState) {
      return (
        <motion.div key="home" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
          <HomeScreen onJoin={handleJoin} connected={connected} />
        </motion.div>
      )
    }

    switch (gameState.phase) {
      case 'lobby':
        return (
          <motion.div key="lobby" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <LobbyRoom gameState={gameState} myId={myId} emit={emit} />
          </motion.div>
        )

      case 'countdown':
        return (
          <motion.div key="countdown" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <LobbyRoom gameState={gameState} myId={myId} emit={emit} />
            {showCountdown && roleReveal && (
              <CountdownOverlay
                roleReveal={roleReveal}
                onComplete={handleCountdownComplete}
              />
            )}
          </motion.div>
        )

      case 'game':
        return (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <GameScreen
              gameState={gameState}
              myId={myId}
              roleReveal={roleReveal}
              emit={emit}
            />
          </motion.div>
        )

      case 'voting':
        return (
          <motion.div key="voting" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <VotingPanel
              gameState={gameState}
              myId={myId}
              emit={emit}
            />
          </motion.div>
        )

      case 'result':
        return (
          <motion.div key="result" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <ResultPopup
              gameState={gameState}
              myId={myId}
              emit={emit}
            />
          </motion.div>
        )

      default:
        return (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <HomeScreen onJoin={handleJoin} connected={connected} />
          </motion.div>
        )
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#0A0A0F' }}>
      <Background />

      {/* Connection indicator */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-ping'}`} />
        <span className="text-xs text-white/30 font-mono hidden sm:block">
          {connected ? 'live' : 'connecting...'}
        </span>
      </div>

      {/* Phase label (dev only if needed) */}
      {/* <div className="fixed top-3 left-3 z-50 text-xs text-white/20 font-mono">{gameState?.phase}</div> */}

      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    </div>
  )
}
