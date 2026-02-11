# 😈 IMPOSTER

A local-network multiplayer social deduction party game. One player is secretly the **Imposter** — everyone else must figure out who it is through clue-based chat rounds!

---

## 🎮 How to Play

1. **Host** starts the server, everyone on the same Wi-Fi opens the client URL
2. Players join by entering their name
3. Host selects the **secret Imposter** (a real player — keep it secret!)
4. Host enters a **secret topic** (e.g. "Watermelon", "Eiffel Tower", "Chess")
5. Game starts — **innocent players see the topic**, **Imposter sees nothing!**
6. Players take turns giving **one clue per round** about the topic (3 rounds total)
7. The Imposter tries to **blend in** by guessing from others' clues
8. After 3 rounds, **everyone votes** for who they think the Imposter is
9. **Majority wins!** — If players vote out the Imposter → Players Win 🎉 | Otherwise → Imposter Wins 😈

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed on the host machine
- All players on the **same Wi-Fi network**

### Step 1 — Install dependencies

```bash
# Option A: Install everything at once
npm install && npm run install:all

# Option B: Install manually
cd server && npm install
cd ../client && npm install
```

### Step 2 — Start the server

```bash
cd server
node server.js
```

You'll see output like:
```
╔══════════════════════════════════════════╗
║     🎮 IMPOSTER SERVER STARTED 🎮   ║
╠══════════════════════════════════════════╣
║  Local:   http://localhost:3001          ║
║  Network: http://192.168.1.42:3001       ║
╚══════════════════════════════════════════╝
📱 Share the Network URL with players on same Wi-Fi!
🌐 Frontend runs on: http://192.168.1.42:5173
```

### Step 3 — Start the frontend

In a **new terminal**:
```bash
cd client
npm run dev
```

### Step 4 — Share with friends

The terminal shows your **local IP** (e.g. `192.168.1.42`).
Everyone on the same Wi-Fi opens: **`http://192.168.1.42:5173`**

That's it! 🎉

---

## 📁 Project Structure

```
imposter/
├── server/
│   ├── server.js          # Node.js + Socket.IO game server
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx                    # Main app + routing
│   │   ├── components/
│   │   │   ├── Background.jsx         # Animated particle background
│   │   │   ├── HomeScreen.jsx         # Join screen
│   │   │   ├── LobbyRoom.jsx          # Player lobby + host controls
│   │   │   ├── PlayerCard.jsx         # Individual player card
│   │   │   ├── CountdownOverlay.jsx   # Role reveal + countdown
│   │   │   ├── GameScreen.jsx         # Main game screen
│   │   │   ├── TurnIndicator.jsx      # Shows whose turn it is
│   │   │   ├── ChatBox.jsx            # Clue chat
│   │   │   ├── VotingPanel.jsx        # Voting interface
│   │   │   └── ResultPopup.jsx        # Win/lose reveal
│   │   ├── hooks/
│   │   │   └── useSocket.js           # Socket.IO hook
│   │   ├── utils/
│   │   │   └── sounds.js              # Web Audio API sound effects
│   │   └── index.css                  # Global styles + Tailwind
│   └── package.json
└── README.md
```

---

## 🔌 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + custom CSS |
| Animations | Framer Motion |
| Realtime | Socket.IO |
| Server | Node.js + Express |
| Sounds | Web Audio API (no files needed!) |
| Storage | localStorage (username persistence) |

---

## 🌐 Network Ports

| Port | Service |
|------|---------|
| 3001 | Socket.IO game server |
| 5173 | Vite dev server (frontend) |

Make sure your firewall allows these ports on your local machine.

---

## 🛠️ Customization

### Change number of rounds
In `server/server.js`, change:
```js
totalRounds: 3,
```

### Change server port
```bash
PORT=4000 node server.js
```

### Point client to a specific server IP
Create `client/.env`:
```
VITE_SERVER_URL=http://192.168.1.42:3001
```

---

## 🎯 Game Rules Summary

- **Minimum players**: 3 (recommended: 4-8)
- **Rounds**: 3 (each player gives 1 clue per round)
- **Clues**: Must relate to the secret topic without naming it directly
- **Imposter**: Must bluff convincingly without knowing the topic
- **Voting**: Majority vote wins; ties mean Imposter wins by default

---

## 🐛 Troubleshooting

**"Can't connect to server"**
- Make sure the server is running (`cd server && node server.js`)
- Check the IP address shown in server output
- Make sure devices are on the same Wi-Fi

**"Connecting..." spinning forever**
- The client is looking for the server at `window.location.hostname:3001`
- If you're on a different port, set `VITE_SERVER_URL` in `.env`

**Player list not updating**
- Refresh the page — localStorage saves your username, so you'll rejoin instantly

**Sounds not working**
- Click anywhere on the page first (browsers require a user gesture to enable audio)

---

## 📝 License

MIT — Have fun! 🎮
