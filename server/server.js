const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const os = require("os");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
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
};

const AVATARS = ["🦊","🐼","🦁","🐯","🐸","🐧","🦄","🐙","🦋","🐺","🦝","🐨"];

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
  // Send full state to all except imposter-specific overrides
  const base = { ...gameState };

  // For each socket, customize if they're the imposter during role reveal
  io.emit("gameState", base);
}

function resetGame() {
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

    gameState.topic = topic;
    gameState.phase = "countdown";
    gameState.round = 1;
    gameState.turnIndex = 0;
    gameState.messages = [];

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

    // Transition to game after countdown
    setTimeout(() => {
      gameState.phase = "game";
      broadcastState();
    }, 6500);
  });

  // ── Send Chat Message ──
  socket.on("sendMessage", ({ text }) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || gameState.phase !== "game") return;

    // Validate it's the current player's turn
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
    };

    gameState.messages.push(message);

    // Advance turn
    gameState.turnIndex = (gameState.turnIndex + 1) % gameState.players.length;

    // Check if full round complete
    const messagesThisRound = gameState.messages.filter(m => m.round === gameState.round).length;
    if (messagesThisRound >= gameState.players.length) {
      if (gameState.round >= gameState.totalRounds) {
        // Move to voting
        gameState.phase = "voting";
        gameState.turnIndex = 0;
      } else {
        gameState.round += 1;
        gameState.turnIndex = 0;
      }
    }

    broadcastState();
  });

  // ── Submit Vote ──
  socket.on("submitVote", ({ targetId }) => {
    const voter = gameState.players.find(p => p.id === socket.id);
    if (!voter || gameState.phase !== "voting" || voter.hasVoted) return;

    gameState.votes[socket.id] = targetId;
    gameState.players = gameState.players.map(p =>
      p.id === socket.id ? { ...p, hasVoted: true, vote: targetId } : p
    );

    // Check if all voted
    const allVoted = gameState.players.every(p => p.hasVoted);
    if (allVoted) {
      // Tally votes
      const tally = {};
      Object.values(gameState.votes).forEach(id => {
        tally[id] = (tally[id] || 0) + 1;
      });

      // Find most voted
      const maxVotes = Math.max(...Object.values(tally));
      const mostVotedId = Object.keys(tally).find(id => tally[id] === maxVotes);
      const imposter = gameState.players.find(p => p.isImposter);

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
    }

    broadcastState();
  });

  // ── Restart ──
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
  console.log("📱 Share the Network URL with players on same Wi-Fi!");
  console.log("🌐 Frontend runs on: http://" + ip + ":5173\n");
});
