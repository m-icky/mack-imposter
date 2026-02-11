const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const os = require("os");
const path = require("path");

const app = express();

// Allow all origins in CORS (needed for Vercel → Railway)
app.use(cors({ origin: "*" }));
app.use(express.static("../client/dist")); // Serve React build

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
});

// ─── Game State & Rooms ───────────────────────────────────────────────────────
const rooms = new Map();

// Helper: Generate 4-char room code
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const AVATARS = ["🦊", "🐼", "🦁", "🐯", "🐸", "🐧", "🦄", "🐙", "🦋", "🐺", "🦝", "🐨", "🐶", "🐱", "🐭", "🐹"];
const TURN_TIMEOUT_MS = 30000; // 30 seconds for each player's turn
const VOTE_TIMEOUT_MS = 20000;

function createRoom(hostSocketId, hostName) {
  let roomId = generateRoomCode();
  while (rooms.has(roomId)) {
    roomId = generateRoomCode();
  }

  const newRoom = {
    id: roomId,
    phase: "lobby",
    players: [],
    hostId: hostSocketId,
    imposterIndex: null,
    messages: [],
    round: 0,
    totalRounds: 3,
    turnIndex: 0,
    topic: null,
    votes: {},
    result: null,
    turnDeadline: null,
    voteDeadline: null,
    timers: { turn: null, vote: null },
    settings: {
      clueTimeout: 30, // seconds
      voteTimeout: 20, // seconds
      totalRounds: 3,
      imposterCount: 1
    }
  };

  rooms.set(roomId, newRoom);
  return newRoom;
}

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

function broadcastState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const safeState = { ...room, timers: undefined };
  io.to(roomId).emit("gameState", safeState);
}

function clearRoomTimers(room) {
  if (room.timers.turn) { clearTimeout(room.timers.turn); room.timers.turn = null; }
  if (room.timers.vote) { clearTimeout(room.timers.vote); room.timers.vote = null; }
}

function startTurnTimer(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  clearRoomTimers(room);
  const timeoutMs = (room.settings?.clueTimeout || 30) * 1000;
  room.turnDeadline = Date.now() + timeoutMs;
  broadcastState(roomId);

  room.timers.turn = setTimeout(() => {
    if (room.phase !== "game") return;

    const skippedPlayer = room.players[room.turnIndex];
    room.messages.push({
      id: Date.now() + Math.random(),
      playerId: null,
      playerName: skippedPlayer?.name || "Player",
      playerAvatar: skippedPlayer?.avatar || "⏭️",
      text: "⏭️ Time's up — skipped!",
      round: room.round,
      timestamp: Date.now(),
      isSystem: true,
    });

    advanceTurn(roomId);
  }, (room.settings?.clueTimeout || 30) * 1000);
}

function advanceTurn(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  const messagesThisRound = room.messages.filter(m => m.round === room.round && !m.isSystem).length;

  if (messagesThisRound >= room.players.length) {
    if (room.round >= room.totalRounds) {
      clearRoomTimers(room);
      room.phase = "voting";
      room.turnDeadline = null;
      room.turnIndex = 0;
      broadcastState(roomId);
      startVoteTimer(roomId);
    } else {
      room.round += 1;
      room.turnIndex = 0;
      broadcastState(roomId);
      startTurnTimer(roomId);
    }
  } else {
    broadcastState(roomId);
    startTurnTimer(roomId);
  }
}

function startVoteTimer(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  clearRoomTimers(room);
  const pendingVoter = room.players.find(p => !p.hasVoted);
  if (!pendingVoter) return;

  const timeoutMs = (room.settings?.voteTimeout || 20) * 1000;
  room.voteDeadline = Date.now() + timeoutMs;
  broadcastState(roomId);

  room.timers.vote = setTimeout(() => {
    if (room.phase !== "voting") return;

    const voter = room.players.find(p => !p.hasVoted);
    if (!voter) return;

    room.votes[voter.id] = "__abstain__";
    room.players = room.players.map(p =>
      p.id === voter.id ? { ...p, hasVoted: true, vote: "__abstain__" } : p
    );

    const allVoted = room.players.every(p => p.hasVoted);
    if (allVoted) {
      resolveVotes(roomId);
    } else {
      room.voteDeadline = null;
      broadcastState(roomId);
      startVoteTimer(roomId);
    }
  }, (room.settings?.voteTimeout || 20) * 1000);
}

function resolveVotes(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  clearRoomTimers(room);
  const tally = {};
  Object.entries(room.votes).forEach(([, targetId]) => {
    if (targetId === "__abstain__") return;
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  const imposter = room.players.find(p => p.isImposter);
  let mostVotedId = null;
  if (Object.keys(tally).length > 0) {
    const maxVotes = Math.max(...Object.values(tally));
    mostVotedId = Object.keys(tally).find(id => tally[id] === maxVotes) || null;
  }

  const win = mostVotedId === imposter?.id ? "players" : "imposter";

  room.result = {
    win,
    imposterName: imposter?.name,
    imposterAvatar: imposter?.avatar,
    mostVotedId,
    tally,
    topic: room.topic,
  };
  room.phase = "result";
  room.voteDeadline = null;
  broadcastState(roomId);
}

function resetGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  clearRoomTimers(room);

  let currentHostIdx = room.players.findIndex(p => p.id === room.hostId);
  if (currentHostIdx === -1) currentHostIdx = 0;

  const nextHostIdx = (currentHostIdx + 1) % room.players.length;
  const nextHostId = room.players[nextHostIdx].id;

  const players = room.players.map(p => ({
    ...p,
    isImposter: false,
    hasVoted: false,
    vote: null,
    isHost: p.id === nextHostId,
  }));

  room.hostId = nextHostId;

  Object.assign(room, {
    phase: "lobby",
    imposterIndex: null,
    messages: [],
    round: 1,
    totalRounds: room.settings?.totalRounds || 3,
    turnIndex: 0,
    topic: null,
    votes: {},
    result: null,
    turnDeadline: null,
    voteDeadline: null,
    players,
  });

  broadcastState(roomId);
}

// ─── Socket Handlers ──────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  socket.on("join", ({ name, roomId, action }) => {
    let room;

    if (action === "create") {
      room = createRoom(socket.id, name);
      console.log(`🏠 Room created: ${room.id} by ${name}`);
    } else {
      room = rooms.get(roomId?.toUpperCase());
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (room.phase !== "lobby" && room.phase !== "result") {
        socket.emit("error", { message: "Game already in progress" });
        return;
      }
    }

    socket.join(room.id);
    socket.data.roomId = room.id;

    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (!existingPlayer) {
      const avatarIndex = room.players.length % AVATARS.length;
      const isHost = room.players.length === 0 || room.hostId === socket.id;

      const player = {
        id: socket.id,
        name,
        isHost,
        isImposter: false,
        hasVoted: false,
        vote: null,
        avatar: AVATARS[avatarIndex],
      };

      room.players.push(player);
    }

    console.log(`👤 ${name} joined room ${room.id}`);
    broadcastState(room.id);
  });

  const getRoom = () => rooms.get(socket.data.roomId);

  socket.on("reorderPlayers", ({ newOrder }) => {
    const room = getRoom();
    if (!room || room.hostId !== socket.id) return;

    const reordered = newOrder
      .map(id => room.players.find(p => p.id === id))
      .filter(Boolean);

    if (reordered.length === room.players.length) {
      room.players = reordered;
      broadcastState(room.id);
    }
  });

  socket.on("updateSettings", (newSettings) => {
    const room = getRoom();
    if (!room || room.hostId !== socket.id || room.phase !== "lobby") return;

    // Validate settings
    const cleanSettings = {
      clueTimeout: Math.min(Math.max(parseInt(newSettings.clueTimeout) || 30, 15), 60),
      voteTimeout: Math.min(Math.max(parseInt(newSettings.voteTimeout) || 20, 10), 45),
      totalRounds: Math.min(Math.max(parseInt(newSettings.totalRounds) || 3, 1), 6),
      imposterCount: Math.min(Math.max(parseInt(newSettings.imposterCount) || 1, 1), Math.floor(room.players.length / 4) || 1, room.players.length - 1)
    };

    room.settings = cleanSettings;
    room.totalRounds = cleanSettings.totalRounds;
    broadcastState(room.id);
  });

  socket.on("startGame", ({ topic }) => {
    console.log('🎮 startGame event received from:', socket.id, 'topic:', topic)
    const room = getRoom();
    console.log('Room found:', room?.id, 'Host:', room?.hostId, 'Players:', room?.players.length)
    if (!room || room.hostId !== socket.id) {
      console.log('❌ Not authorized or no room')
      return;
    }
    if (room.players.length < 4) {
      console.log('❌ Not enough players:', room.players.length)
      return; // Need at least 4 players
    }

    clearRoomTimers(room);

    // Randomly select imposters based on settings, excluding the host
    const count = room.settings?.imposterCount || 1;
    const nonHostIndices = room.players
      .map((p, idx) => (p.id !== room.hostId ? idx : -1))
      .filter(idx => idx !== -1);

    const indices = [];
    const pool = [...nonHostIndices];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * pool.length);
      indices.push(pool.splice(randIdx, 1)[0]);
    }

    console.log(`🎲 Random imposter indices: ${indices.join(", ")}`);
    room.imposterIndex = indices[0]; // fallback for legacy code
    room.imposterIndices = indices;

    room.players = room.players.map((p, idx) => ({
      ...p,
      isImposter: indices.includes(idx),
    }));

    room.topic = topic;
    room.phase = "countdown";
    room.round = 1;
    room.totalRounds = room.settings?.totalRounds || 3;
    room.turnIndex = 0;
    room.messages = [];
    room.turnDeadline = null;
    room.voteDeadline = null;

    console.log('✅ Broadcasting state, phase:', room.phase)
    broadcastState(room.id);

    room.players.forEach(player => {
      const pSocket = io.sockets.sockets.get(player.id);
      if (!pSocket) return;
      if (player.isImposter) {
        pSocket.emit("roleReveal", { role: "imposter", topic: null });
      } else {
        pSocket.emit("roleReveal", { role: "innocent", topic });
      }
    });

    setTimeout(() => {
      if (room.phase !== "countdown") return;
      room.phase = "game";
      broadcastState(room.id);
      startTurnTimer(room.id);
    }, 6500);
  });

  socket.on("sendMessage", ({ text }) => {
    const room = getRoom();
    if (!room || room.phase !== "game") return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const currentPlayer = room.players[room.turnIndex];
    if (currentPlayer.id !== socket.id) return;

    const message = {
      id: Date.now() + Math.random(),
      playerId: socket.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      text,
      round: room.round,
      timestamp: Date.now(),
      isSystem: false,
    };

    room.messages.push(message);
    advanceTurn(room.id);
  });

  socket.on("submitVote", ({ targetId }) => {
    const room = getRoom();
    if (!room || room.phase !== "voting") return;

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter || voter.hasVoted) return;

    clearRoomTimers(room);

    room.votes[socket.id] = targetId;
    room.players = room.players.map(p =>
      p.id === socket.id ? { ...p, hasVoted: true, vote: targetId } : p
    );

    const allVoted = room.players.every(p => p.hasVoted);
    if (allVoted) {
      resolveVotes(room.id);
    } else {
      room.voteDeadline = null;
      broadcastState(room.id);
      startVoteTimer(room.id);
    }
  });

  socket.on("restartGame", () => {
    const room = getRoom();
    if (!room || room.hostId !== socket.id) return;
    resetGame(room.id);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const wasHost = room.hostId === socket.id;
    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      clearRoomTimers(room);
      rooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted (empty)`);
    } else {
      if (wasHost && room.players.length > 0) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }
      broadcastState(roomId);
    }
  });
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║     🎮 IMPOSTER SERVER STARTED 🎮   ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Local:   http://localhost:${PORT}           ║`);
  console.log(`║  Network: http://${ip}:${PORT}       ║`);
  console.log("╚══════════════════════════════════════════╝\n");
});
