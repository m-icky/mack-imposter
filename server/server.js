const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const os = require("os");

const app = express();

// Allow all origins in CORS (needed for Vercel → Railway)
app.use(cors({ origin: "*" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
});

// ─── Game State ───────────────────────────────────────────────────────────────
let gameState = {
  phase: "lobby", // lobby | countdown | game | voting | result
  players: [],    // { id, name, isHost, isImposter, hasVoted, vote, avatar }
  hostIndex: 0,
  imposterIndex: null,
  messages: [],
  round: 0,
  totalRounds: 3,
  turnIndex: 0,
  topic: null,
  votes: {},      // { voterId: targetId }
  result: null,   // { win: 'players'|'imposter', imposterName, voteCount }
  turnDeadline: null,   // Unix ms — when current turn expires
  voteDeadline: null,   // Unix ms — when current vote slot expires
};

// Active server-side timers (so we can clear them on reset)
let turnTimer = null;
let voteTimer = null;

const TURN_TIMEOUT_MS = 15000;  // 15 seconds per clue turn
const VOTE_TIMEOUT_MS = 20000;  // 20 seconds per vote

const AVATARS = ["🦊","🐼","🦁","🐯","🐸","🐧","🦄","🐙","🦋","🐺","🦝","🐨", "🐶", "🐱", "🐭", "🐹"];

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

function broadcastState() {
  io.emit("gameState", gameState);
}

function clearTimers() {
  if (turnTimer) { clearTimeout(turnTimer); turnTimer = null; }
  if (voteTimer) { clearTimeout(voteTimer); voteTimer = null; }
}

// Start a 15-second server timer for the current clue turn
function startTurnTimer() {
  clearTimers();
  gameState.turnDeadline = Date.now() + TURN_TIMEOUT_MS;
  broadcastState();

  turnTimer = setTimeout(() => {
    if (gameState.phase !== "game") return;

    const skippedPlayer = gameState.players[gameState.turnIndex];
    // Insert a "skipped" system message
    gameState.messages.push({
      id: Date.now() + Math.random(),
      playerId: null,
      playerName: skippedPlayer?.name || "Player",
      playerAvatar: skippedPlayer?.avatar || "⏭️",
      text: "⏭️ Time's up — skipped!",
      round: gameState.round,
      timestamp: Date.now(),
      isSystem: true,
    });

    advanceTurn();
  }, TURN_TIMEOUT_MS);
}

// Advance turn and check for round/phase completion
function advanceTurn() {
  gameState.turnIndex = (gameState.turnIndex + 1) % gameState.players.length;
  const messagesThisRound = gameState.messages.filter(m => m.round === gameState.round && !m.isSystem).length;

  if (messagesThisRound >= gameState.players.length) {
    if (gameState.round >= gameState.totalRounds) {
      clearTimers();
      gameState.phase = "voting";
      gameState.turnDeadline = null;
      gameState.turnIndex = 0;
      broadcastState();
      startVoteTimer();
    } else {
      gameState.round += 1;
      gameState.turnIndex = 0;
      broadcastState();
      startTurnTimer();
    }
  } else {
    broadcastState();
    startTurnTimer();
  }
}

// Start a 20-second server timer for the current vote slot
function startVoteTimer() {
  clearTimers();
  // Find first player who hasn't voted yet
  const pendingVoter = gameState.players.find(p => !p.hasVoted);
  if (!pendingVoter) return;

  gameState.voteDeadline = Date.now() + VOTE_TIMEOUT_MS;
  broadcastState();

  voteTimer = setTimeout(() => {
    if (gameState.phase !== "voting") return;
    // Auto-skip: cast a null/abstain vote for the pending player
    const voter = gameState.players.find(p => !p.hasVoted);
    if (!voter) return;

    gameState.votes[voter.id] = "__abstain__";
    gameState.players = gameState.players.map(p =>
      p.id === voter.id ? { ...p, hasVoted: true, vote: "__abstain__" } : p
    );

    const allVoted = gameState.players.every(p => p.hasVoted);
    if (allVoted) {
      resolveVotes();
    } else {
      gameState.voteDeadline = null;
      broadcastState();
      startVoteTimer();
    }
  }, VOTE_TIMEOUT_MS);
}

function resolveVotes() {
  clearTimers();
  const tally = {};
  Object.entries(gameState.votes).forEach(([, targetId]) => {
    if (targetId === "__abstain__") return;
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  const imposter = gameState.players.find(p => p.isImposter);
  let mostVotedId = null;
  if (Object.keys(tally).length > 0) {
    const maxVotes = Math.max(...Object.values(tally));
    mostVotedId = Object.keys(tally).find(id => tally[id] === maxVotes) || null;
  }

  const win = mostVotedId === imposter?.id ? "players" : "imposter";

  gameState.result = {
    win,
    imposterName: imposter?.name,
    imposterAvatar: imposter?.avatar,
    mostVotedId,
    tally,
    topic: gameState.topic,
  };
  gameState.phase = "result";
  gameState.voteDeadline = null;
  broadcastState();
}

function resetGame() {
  clearTimers();

  const players = gameState.players.map(p => ({
    ...p,
    isImposter: false,
    hasVoted: false,
    vote: null,
    isHost: false,
  }));

  // Rotate host
  const nextHostIndex = (gameState.hostIndex + 1) % players.length;
  players[nextHostIndex].isHost = true;

  gameState = {
    ...gameState,
    phase: "lobby",
    hostIndex: nextHostIndex,
    imposterIndex: null,
    messages: [],
    round: 1,
    totalRounds: 3,
    turnIndex: 0,
    topic: null,
    votes: {},
    result: null,
    turnDeadline: null,
    voteDeadline: null,
    players,
  };

  broadcastState();
}

// ─── Socket Handlers ──────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // Send current state on connect
  socket.emit("gameState", gameState);

  // ── Join ──
  socket.on("join", ({ name }) => {
    const existingIndex = gameState.players.findIndex(p => p.id === socket.id);
    if (existingIndex !== -1) return;

    const avatarIndex = gameState.players.length % AVATARS.length;
    const isFirstPlayer = gameState.players.length === 0;

    const player = {
      id: socket.id,
      name,
      isHost: isFirstPlayer,
      isImposter: false,
      hasVoted: false,
      vote: null,
      avatar: AVATARS[avatarIndex],
    };

    if (isFirstPlayer) gameState.hostIndex = 0;
    gameState.players.push(player);

    console.log(`👤 Joined: ${name}`);
    broadcastState();
  });

  // ── Reorder Players (Host only) ──
  socket.on("reorderPlayers", ({ newOrder }) => {
    const host = gameState.players.find(p => p.id === socket.id && p.isHost);
    if (!host) return;

    const reordered = newOrder
      .map(id => gameState.players.find(p => p.id === id))
      .filter(Boolean);

    if (reordered.length === gameState.players.length) {
      gameState.players = reordered;
      broadcastState();
    }
  });

  // ── Select Imposter (Host only) ──
  socket.on("selectImposter", ({ targetId }) => {
    const host = gameState.players.find(p => p.id === socket.id && p.isHost);
    if (!host || gameState.phase !== "lobby") return;

    gameState.players = gameState.players.map(p => ({
      ...p,
      isImposter: p.id === targetId,
    }));

    gameState.imposterIndex = gameState.players.findIndex(p => p.id === targetId);
    broadcastState();
  });

  // ── Start Game: Host sends topic ──
  socket.on("startGame", ({ topic }) => {
    const host = gameState.players.find(p => p.id === socket.id && p.isHost);
    if (!host || gameState.imposterIndex === null) return;

    clearTimers();
    gameState.topic = topic;
    gameState.phase = "countdown";
    gameState.round = 1;
    gameState.turnIndex = 0;
    gameState.messages = [];
    gameState.turnDeadline = null;
    gameState.voteDeadline = null;

    broadcastState();

    // Send role reveals individually
    gameState.players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (!playerSocket) return;
      if (player.isImposter) {
        playerSocket.emit("roleReveal", { role: "imposter", topic: null });
      } else {
        playerSocket.emit("roleReveal", { role: "innocent", topic });
      }
    });

    // Transition to game after countdown then start turn timer
    setTimeout(() => {
      if (gameState.phase !== "countdown") return; // guard against reset during countdown
      gameState.phase = "game";
      broadcastState();
      startTurnTimer();
    }, 6500);
  });

  // ── Send Chat Message ──
  socket.on("sendMessage", ({ text }) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || gameState.phase !== "game") return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    if (currentPlayer.id !== socket.id) return;

    const message = {
      id: Date.now() + Math.random(),
      playerId: socket.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      text,
      round: gameState.round,
      timestamp: Date.now(),
      isSystem: false,
    };

    gameState.messages.push(message);
    advanceTurn();
  });

  // ── Submit Vote ──
  socket.on("submitVote", ({ targetId }) => {
    const voter = gameState.players.find(p => p.id === socket.id);
    if (!voter || gameState.phase !== "voting" || voter.hasVoted) return;

    clearTimers(); // Cancel the auto-skip for this voter slot

    gameState.votes[socket.id] = targetId;
    gameState.players = gameState.players.map(p =>
      p.id === socket.id ? { ...p, hasVoted: true, vote: targetId } : p
    );

    const allVoted = gameState.players.every(p => p.hasVoted);
    if (allVoted) {
      resolveVotes();
    } else {
      gameState.voteDeadline = null;
      broadcastState();
      startVoteTimer(); // Start timer for next pending voter
    }
  });

  // ── Restart — any phase, host only ──
  socket.on("restartGame", () => {
    const host = gameState.players.find(p => p.id === socket.id && p.isHost);
    if (!host) return;
    resetGame();
  });

  // ── Disconnect ──
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    const wasHost = gameState.players.find(p => p.id === socket.id && p.isHost);
    gameState.players = gameState.players.filter(p => p.id !== socket.id);

    if (gameState.players.length === 0) {
      clearTimers();
      gameState = {
        phase: "lobby",
        players: [],
        hostIndex: 0,
        imposterIndex: null,
        messages: [],
        round: 1,
        totalRounds: 3,
        turnIndex: 0,
        topic: null,
        votes: {},
        result: null,
        turnDeadline: null,
        voteDeadline: null,
      };
    } else if (wasHost && gameState.players.length > 0) {
      gameState.hostIndex = 0;
      gameState.players[0].isHost = true;
    }

    broadcastState();
  });
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "RSGP Imposter Server Running 🎮", players: gameState.players.length });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║     🎮 RSGP IMPOSTER SERVER STARTED 🎮   ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Local:   http://localhost:${PORT}           ║`);
  console.log(`║  Network: http://${ip}:${PORT}       ║`);
  console.log("╚══════════════════════════════════════════╝\n");
});
