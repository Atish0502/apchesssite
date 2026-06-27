const { Chess } = require('chess.js');

const INITIAL_TIME = 600; // 10 minutes in seconds
const timerIntervals = {};

module.exports = io => {
    io.on('connection', socket => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('joinRoom', function(data) {
            const roomCode = (data.code || '').trim().toUpperCase();
            if (!roomCode) {
                socket.emit('errorMsg', 'Invalid room code');
                return;
            }

            let game = global.games[roomCode];
            let role = null;

            if (!game) {
                // Create new room, assign first player as White
                game = {
                    chess: new Chess(),
                    whiteSocketId: socket.id,
                    blackSocketId: null,
                    spectators: [],
                    whiteTime: INITIAL_TIME,
                    blackTime: INITIAL_TIME,
                    chat: [],
                    timerStarted: false,
                    reconnectTimeout: null
                };
                global.games[roomCode] = game;
                role = 'white';
            } else {
                // Reconnecting or joining existing room
                if (game.whiteSocketId === null) {
                    game.whiteSocketId = socket.id;
                    role = 'white';
                    if (game.reconnectTimeout) {
                        clearTimeout(game.reconnectTimeout);
                        game.reconnectTimeout = null;
                    }
                    // Resume timer if black is also present
                    if (game.blackSocketId) {
                        game.timerStarted = true;
                    }
                } else if (game.blackSocketId === null) {
                    game.blackSocketId = socket.id;
                    role = 'black';
                    if (game.reconnectTimeout) {
                        clearTimeout(game.reconnectTimeout);
                        game.reconnectTimeout = null;
                    }
                    // First time black joins or black reconnects -> start timer
                    game.timerStarted = true;
                    startTimerInterval(io, roomCode);
                } else {
                    // Spectator
                    game.spectators.push(socket.id);
                    role = 'spectator';
                }
            }

            socket.roomCode = roomCode;
            socket.playerColor = role;
            socket.join(roomCode);

            // Send initial state to the joining socket
            socket.emit('roomState', {
                role: role,
                fen: game.chess.fen(),
                pgn: game.chess.pgn(),
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
                turn: game.chess.turn(),
                chat: game.chat,
                gameHasStarted: game.whiteSocketId !== null && game.blackSocketId !== null
            });

            // Send system message to room
            const systemMsg = {
                msg: `${role.charAt(0).toUpperCase() + role.slice(1)} joined the room.`,
                color: 'system',
                ts: Date.now()
            };
            game.chat.push(systemMsg);
            if (game.chat.length > 28) game.chat.shift();

            io.to(roomCode).emit('chatUpdate', { chat: game.chat });

            // Notify everyone of player connection state
            io.to(roomCode).emit('roomStatus', {
                whiteConnected: game.whiteSocketId !== null,
                blackConnected: game.blackSocketId !== null,
                spectatorCount: game.spectators.length,
                gameHasStarted: game.whiteSocketId !== null && game.blackSocketId !== null
            });
        });

        socket.on('makeMove', function(data) {
            const roomCode = socket.roomCode;
            const playerColor = socket.playerColor;

            if (!roomCode || !global.games[roomCode]) return;
            const game = global.games[roomCode];

            // Validate turn
            const activeTurn = game.chess.turn();
            if ((activeTurn === 'w' && playerColor !== 'white') || (activeTurn === 'b' && playerColor !== 'black')) {
                socket.emit('invalidMove', { reason: 'Not your turn', move: data.move });
                return;
            }

            // Attempt move
            const moveResult = game.chess.move(data.move);
            if (!moveResult) {
                socket.emit('invalidMove', { reason: 'Illegal chess move', move: data.move });
                return;
            }

            // Broadcast move update
            io.to(roomCode).emit('moveMade', {
                move: moveResult,
                fen: game.chess.fen(),
                pgn: game.chess.pgn(),
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
                turn: game.chess.turn()
            });

            // Check game over conditions
            if (game.chess.game_over()) {
                game.timerStarted = false;
                let winner = null;
                let reason = 'draw';

                if (game.chess.in_checkmate()) {
                    reason = 'checkmate';
                    winner = game.chess.turn() === 'w' ? 'black' : 'white';
                } else if (game.chess.in_draw()) {
                    reason = 'draw';
                }

                io.to(roomCode).emit('gameOver', { reason, winner });
                cleanupInterval(roomCode);
            }
        });

        socket.on('chatMessage', function(data) {
            const roomCode = socket.roomCode;
            const playerColor = socket.playerColor;

            if (!roomCode || !global.games[roomCode] || !playerColor) return;
            const game = global.games[roomCode];

            const msgObj = {
                msg: (data.msg || '').substring(0, 150),
                color: playerColor,
                ts: Date.now()
            };

            game.chat.push(msgObj);
            if (game.chat.length > 28) game.chat.shift();

            io.to(roomCode).emit('chatUpdate', { chat: game.chat });
        });

        socket.on('resign', function() {
            const roomCode = socket.roomCode;
            const playerColor = socket.playerColor;

            if (!roomCode || !global.games[roomCode]) return;
            const game = global.games[roomCode];

            if (playerColor === 'white' || playerColor === 'black') {
                game.timerStarted = false;
                const winner = playerColor === 'white' ? 'black' : 'white';
                io.to(roomCode).emit('gameOver', { reason: 'resignation', winner });
                cleanupInterval(roomCode);
            }
        });

        socket.on('disconnect', function() {
            const roomCode = socket.roomCode;
            const playerColor = socket.playerColor;

            if (!roomCode || !global.games[roomCode]) return;
            const game = global.games[roomCode];

            console.log(`Socket disconnected: ${socket.id} (${playerColor} in room ${roomCode})`);

            let systemMsgText = '';

            if (playerColor === 'white') {
                game.whiteSocketId = null;
                game.timerStarted = false; // Pause timer during disconnect
                systemMsgText = 'White player disconnected. 30 seconds to reconnect.';
            } else if (playerColor === 'black') {
                game.blackSocketId = null;
                game.timerStarted = false; // Pause timer during disconnect
                systemMsgText = 'Black player disconnected. 30 seconds to reconnect.';
            } else if (playerColor === 'spectator') {
                const index = game.spectators.indexOf(socket.id);
                if (index > -1) {
                    game.spectators.splice(index, 1);
                }
                systemMsgText = 'A spectator left the room.';
            }

            // Broadcast connection status
            io.to(roomCode).emit('roomStatus', {
                whiteConnected: game.whiteSocketId !== null,
                blackConnected: game.blackSocketId !== null,
                spectatorCount: game.spectators.length,
                gameHasStarted: game.whiteSocketId !== null && game.blackSocketId !== null
            });

            // Send system message
            if (systemMsgText) {
                const sysMsg = {
                    msg: systemMsgText,
                    color: 'system',
                    ts: Date.now()
                };
                game.chat.push(sysMsg);
                if (game.chat.length > 28) game.chat.shift();
                io.to(roomCode).emit('chatUpdate', { chat: game.chat });
            }

            // Cleanup & Forfeit timeouts
            if (!game.whiteSocketId && !game.blackSocketId) {
                // Both players gone: clean up room in 15 seconds if empty
                if (game.reconnectTimeout) clearTimeout(game.reconnectTimeout);
                game.reconnectTimeout = setTimeout(() => {
                    const g = global.games[roomCode];
                    if (g && !g.whiteSocketId && !g.blackSocketId) {
                        console.log(`Cleaning up empty room: ${roomCode}`);
                        cleanupInterval(roomCode);
                        delete global.games[roomCode];
                    }
                }, 15000);
            } else if (playerColor === 'white' || playerColor === 'black') {
                // One player disconnected: start 30s forfeit timeout
                if (game.reconnectTimeout) clearTimeout(game.reconnectTimeout);
                game.reconnectTimeout = setTimeout(() => {
                    const g = global.games[roomCode];
                    if (g) {
                        if (playerColor === 'white' && !g.whiteSocketId && g.blackSocketId) {
                            io.to(roomCode).emit('gameOver', { reason: 'forfeit', winner: 'black' });
                            cleanupInterval(roomCode);
                        } else if (playerColor === 'black' && !g.blackSocketId && g.whiteSocketId) {
                            io.to(roomCode).emit('gameOver', { reason: 'forfeit', winner: 'white' });
                            cleanupInterval(roomCode);
                        }
                    }
                }, 30000);
            }
        });
    });
};

function startTimerInterval(io, roomCode) {
    if (timerIntervals[roomCode]) return;

    timerIntervals[roomCode] = setInterval(() => {
        const game = global.games[roomCode];
        if (!game) {
            cleanupInterval(roomCode);
            return;
        }

        if (game.timerStarted) {
            const activeTurn = game.chess.turn();
            if (activeTurn === 'w') {
                if (game.whiteTime > 0) {
                    game.whiteTime--;
                    if (game.whiteTime <= 0) {
                        game.whiteTime = 0;
                        game.timerStarted = false;
                        io.to(roomCode).emit('gameOver', { reason: 'timeout', winner: 'black' });
                        cleanupInterval(roomCode);
                    }
                }
            } else {
                if (game.blackTime > 0) {
                    game.blackTime--;
                    if (game.blackTime <= 0) {
                        game.blackTime = 0;
                        game.timerStarted = false;
                        io.to(roomCode).emit('gameOver', { reason: 'timeout', winner: 'white' });
                        cleanupInterval(roomCode);
                    }
                }
            }

            io.to(roomCode).emit('timerUpdate', {
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
                turn: activeTurn
            });
        }
    }, 1000);
}

function cleanupInterval(roomCode) {
    if (timerIntervals[roomCode]) {
        clearInterval(timerIntervals[roomCode]);
        delete timerIntervals[roomCode];
    }
}