// Web Audio API sound effects - no external files needed!

let audioCtx = null

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
  try {
    const ctx = getAudioCtx()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay)
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

    oscillator.start(ctx.currentTime + delay)
    oscillator.stop(ctx.currentTime + delay + duration)
  } catch (e) {
    // Audio not available - silent fail
  }
}

export const sounds = {
  tick() {
    playTone(880, 0.1, 'square', 0.2)
  },

  countdownBeep(num) {
    const freqs = { 5: 440, 4: 466, 3: 494, 2: 523, 1: 587 }
    playTone(freqs[num] || 440, 0.2, 'sine', 0.4)
  },

  go() {
    playTone(880, 0.1, 'sine', 0.5)
    playTone(1100, 0.15, 'sine', 0.5, 0.12)
    playTone(1320, 0.3, 'sine', 0.5, 0.26)
  },

  messageIn() {
    playTone(1200, 0.08, 'sine', 0.15)
  },

  vote() {
    playTone(600, 0.15, 'sine', 0.3)
    playTone(800, 0.15, 'sine', 0.3, 0.15)
  },

  drumroll() {
    // Rapid ticks
    for (let i = 0; i < 20; i++) {
      const delay = i * 0.05
      const freq = 180 + (i * 3)
      playTone(freq, 0.04, 'square', 0.15, delay)
    }
  },

  playersWin() {
    const melody = [523, 659, 784, 1047]
    melody.forEach((freq, i) => {
      playTone(freq, 0.3, 'sine', 0.4, i * 0.15)
    })
  },

  imposterWins() {
    const melody = [400, 350, 300, 250]
    melody.forEach((freq, i) => {
      playTone(freq, 0.4, 'sawtooth', 0.3, i * 0.2)
    })
  },

  roleReveal() {
    playTone(200, 0.5, 'sawtooth', 0.3)
    playTone(150, 0.4, 'sawtooth', 0.3, 0.5)
    playTone(100, 0.6, 'square', 0.2, 0.9)
  },

  join() {
    playTone(440, 0.1, 'sine', 0.2)
    playTone(550, 0.1, 'sine', 0.2, 0.1)
  }
}
