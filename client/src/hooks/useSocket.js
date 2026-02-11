import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

// In production (unified deployment), use relative path so it respects HTTPS and same domain.
// In development, assume standard local setup.
const SERVER_URL = import.meta.env.VITE_SERVER_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/');

console.log('🔌 Connecting to server:', SERVER_URL)

export function useSocket() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [roleReveal, setRoleReveal] = useState(null) // { role, topic }

  useEffect(() => {
    const socket = io(SERVER_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('🟢 Connected to server')
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('🔴 Disconnected from server')
    })

    socket.on('gameState', (state) => {
      setGameState(state)
    })

    socket.on('roleReveal', (data) => {
      setRoleReveal(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data)
    }
  }, [])

  const socketId = socketRef.current?.id

  return {
    socket: socketRef.current,
    connected,
    gameState,
    roleReveal,
    emit,
    socketId: socketRef.current?.id,
    getSocketId: () => socketRef.current?.id,
  }
}
