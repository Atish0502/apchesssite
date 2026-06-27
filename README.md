# AP Chess

AP Chess is a premium, lightweight, real-time online multiplayer and player-vs-AI chess platform built on Node.js, Express, Socket.IO, and Chessboard.js. The site features a lovable Sakura-plum dark theme, real-time room chat, in-memory game state validation, and custom browser-synthesized audio effects.

---

## Key Features

1. **Custom Room & Role Assignment**:
   - Create custom rooms using your own room codes, or generate random ones.
   - Automatically assigns player colors (White for the first joiner, Black for the second).
   - Any subsequent connections to the same room code are put in **Spectator Mode** (read-only view with full chat access).

2. **Server-Side Move Validation**:
   - Built-in verification utilizing `chess.js` on the Node server.
   - Ensures no player can make illegal moves or cheat, keeping both client boards 100% synchronized.

3. **Timers & Graceful Reconnection**:
   - Synchronized 10-minute game clocks that start once both players join.
   - Robust reconnection handler: if a player disconnects, the timer is paused, and a 30-second forfeit warning overlay appears for the opponent. If the player returns within the window, the game continues seamlessly.

4. **Advanced Chess AI Engine**:
   - **Easy**: Plays mostly random moves, looking for basic captures 25% of the time.
   - **Intermediate**: Minimax search at Depth 2 with Piece-Square Tables (PST) evaluating positional advantages.
   - **Hard**: Minimax search at Depth 3 optimized with Alpha-Beta pruning and move sorting (evaluating captures and promotions first to trigger fast cutoffs). Executes in under 15ms.
   - Supports board flipping and turning back time (undoing 2 moves).

5. **Pawn Promotion Modal**:
   - Captures pawns reaching the 8th rank and prompts the player with a custom choice modal (Queen, Rook, Bishop, or Knight) styled to their color.

6. **Web Audio API Synth Effects**:
   - Synthesizes clicks, thuds, and double-chime check alerts directly in the browser, eliminating the need to load heavy external audio files.

---

## File Structure

```text
├── index.js                  # App entrance file (loads environment and server)
├── config.js                 # App configuration (port assignment, Render friendly)
├── server/
│   ├── server.js             # Express app setup, Handlebars config, listener setup
│   ├── routes/
│   │   └── routes.js         # Page routing controllers (/, /game, /ai)
│   └── sockets/
│       └── io.js             # Socket.IO game lobby, move validator, and timers
└── front/
    ├── views/
    │   ├── index.html        # Main lobby / landing dashboard page
    │   ├── game.html         # Multiplayer match page
    │   ├── ai.html           # Offline AI challenge page
    │   └── partials/
    │       └── head.html     # Global script/style imports (chessboard, jquery, etc)
    └── public/
        ├── css/
        │   ├── custom.css    # Main theme styling (colors, glassmorphism, highlights)
        │   └── chessboard-1.0.0.min.css
        ├── js/
        │   ├── index.js      # Client socket handler, room UI, Web Audio synth
        │   ├── ai.js         # ChessAI algorithms, offline game controller
        │   ├── chess-0.10.3.min.js
        │   ├── chessboard-1.0.0.min.js
        │   └── jquery-3.7.0.min.js
        └── img/
            └── chesspieces/  # Standard Wikipedia chess piece assets
```

---

## Code Breakdown

### 1. Backend Server & Routing
* **`index.js` & `server/server.js`**:
  Initializes an Express application combined with an HTTP Server to run Socket.IO. Configures the Handlebars template engine to render `.html` view files and serves static assets from `/front/public`.
* **`server/routes/routes.js`**:
  Sets up three primary endpoints:
  - `/` (Home lobby: selects AI difficulty or enters a room code).
  - `/game` (Multiplayer page: reads `?code=XXXX` query parameter).
  - `/ai` (AI gameplay page: reads `?difficulty=easy|intermediate|hard` query parameter).

### 2. Socket Room Logic (`server/sockets/io.js`)
* Stores running games in a global `global.games[roomCode]` dictionary.
* **`joinRoom`**: Assigns socket IDs to `whiteSocketId` and `blackSocketId`. If both are full, assigns the user as a spectator. Sends the current board FEN, PGN history, chat history, and active timers to the client.
* **`makeMove`**: Listens for moves from clients, checks if the client is moving on their turn, applies the move on the server-side `Chess` instance, and broadcasts the updated FEN to the room. If the move leads to checkmate or draw, it ends the timer and notifies the clients.
* **`disconnect`**: Triggers a 30-second cleanup timer if a player closes their tab. If the player returns under the same room code, the timeout is cleared and they resume playing.

### 3. Client Multiplayer Logic (`front/public/js/index.js`)
* Connects to Socket.IO, listens to `roomState` to initialize the board, sets orientation, and updates timers.
* Listens to `roomStatus` to unlock piece draggable actions once both players are in the room.
* Synthesizes audio click soundwaves dynamically using browser oscillators (`audioCtx.createOscillator()`).
* Tracks pawn coordinates to display the pawn promotion dialog before sending the finalized move.

### 4. Chess AI Engine (`front/public/js/ai.js`)
* Evaluates the board by scoring each piece on material value (Pawn=100, Knight=320, Bishop=330, Rook=500, Queen=900) combined with positional weights from 8x8 **Piece-Square Tables**.
* Uses **NegaMax minimax search** (with values inverted per turn) to search ahead:
  - Alpha-Beta Pruning discards branches that cannot possibly affect the final decision.
  - Sorting capturing moves and promotions first increases pruning efficiency, allowing a Depth 3 search to execute in ~10ms.

---

## Local Setup & Deployment

### Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open your browser to `http://localhost:1000`.

### Deploy to Render
1. Create a Web Service on [Render.com](https://render.com).
2. Connect your GitHub repository.
3. Configure the settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Deploy! The service will automatically bind to the dynamic port exposed by Render.
