// Socket.IO Connection Setup
const socket = io();

// Get room code from URL params
const urlParams = new URLSearchParams(window.location.search);
const roomCode = (urlParams.get('code') || '').trim().toUpperCase();

if (!roomCode) {
    // Redirect to lobby if no room code
    window.location.replace('/?error=invalidCode');
}

// Game State Variables
let myColor = null; // 'white', 'black', or 'spectator'
let gameHasStarted = false;
let gameOverState = false;
let whiteTime = 600;
let blackTime = 600;
let activeTurn = 'w';
let pendingMove = null;
let disconnectInterval = null;

// Initialize Chessboard and Chess.js
const game = new Chess();
let board = null;

// Audio Synth Context
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        if (type === 'capture') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'check') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(783.99, now + 0.08); // G5
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else { // Normal Move
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        console.warn('Audio failed to play', e);
    }
}

// Format seconds into MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update clock UI displays
function updateTimersUI() {
    $('#white-timer').text(formatTime(whiteTime));
    $('#black-timer').text(formatTime(blackTime));

    // Remove active styles
    $('#whiteTimerCard, #blackTimerCard').removeClass('active');

    if (!gameHasStarted || gameOverState) return;

    if (activeTurn === 'w') {
        $('#whiteTimerCard').addClass('active');
    } else {
        $('#blackTimerCard').addClass('active');
    }
}

// Highlight squares (check and last move)
function highlightSquares(move) {
    // Clear old highlights
    $('.square-55d63').removeClass('highlight-move highlight-check');

    // Highlight last move squares
    if (move) {
        $(`.square-${move.from}`).addClass('highlight-move');
        $(`.square-${move.to}`).addClass('highlight-move');
    }

    // Highlight check square
    if (game.in_check()) {
        const turn = game.turn();
        const boardRepresentation = game.board();
        let kingSquare = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardRepresentation[row][col];
                if (piece && piece.type === 'k' && piece.color === turn) {
                    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
                    kingSquare = files[col] + ranks[row];
                    break;
                }
            }
            if (kingSquare) break;
        }

        if (kingSquare) {
            $(`.square-${kingSquare}`).addClass('highlight-check');
        }
    }
}

// Update status panel text
function updateStatusUI() {
    let statusText = '';
    const turnColor = (game.turn() === 'w') ? 'White' : 'Black';

    if (gameOverState) return; // Managed by gameOver socket event

    if (!gameHasStarted) {
        statusText = 'Waiting for second player to connect...';
    } else {
        if (myColor === 'spectator') {
            statusText = `Spectating. ${turnColor}'s turn.`;
        } else if ((game.turn() === 'w' && myColor === 'white') || (game.turn() === 'b' && myColor === 'black')) {
            statusText = 'Your Turn!';
            if (game.in_check()) statusText += ' (CHECK)';
        } else {
            statusText = `Waiting for Opponent (${turnColor}'s turn)...`;
            if (game.in_check()) statusText += ' (CHECK)';
        }
    }

    $('#status').text(statusText);
    $('#pgn').text(game.pgn() || 'No moves played yet.');
}

// Chessboard move handlers
function onDragStart(source, piece, position, orientation) {
    if (gameOverState || !gameHasStarted) return false;
    if (myColor === 'spectator') return false;

    // Verify player is moving their own pieces
    if ((myColor === 'white' && piece.search(/^b/) !== -1) || 
        (myColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Verify it is their turn
    if ((game.turn() === 'w' && myColor !== 'white') || 
        (game.turn() === 'b' && myColor !== 'black')) {
        return false;
    }
}

function onDrop(source, target) {
    initAudio();
    const pieceObj = game.get(source);
    
    // Check for Pawn Promotion
    if (pieceObj && pieceObj.type === 'p') {
        const isPromoRank = (pieceObj.color === 'w' && target.endsWith('8')) || 
                           (pieceObj.color === 'b' && target.endsWith('1'));
        if (isPromoRank) {
            // Check legality including promotion
            const moves = game.moves({ verbose: true });
            const isLegal = moves.some(m => m.from === source && m.to === target && m.flags.includes('p'));
            if (isLegal) {
                pendingMove = { from: source, to: target };
                showPromotionModal(pieceObj.color);
                return; // Wait for promotion dialog selection
            }
        }
    }

    const currentMoveObj = { from: source, to: target };
    const move = game.move(currentMoveObj);

    if (move === null) return 'snapback';

    // Send move to server
    socket.emit('makeMove', { move: currentMoveObj });
    updateStatusUI();
}

function onSnapEnd() {
    board.position(game.fen());
}

// Promotion Modal Controls
function showPromotionModal(color) {
    const promoColor = color === 'w' ? 'w' : 'b';
    $('#promo-q').attr('src', `/public/img/chesspieces/wikipedia/${promoColor}Q.png`);
    $('#promo-r').attr('src', `/public/img/chesspieces/wikipedia/${promoColor}R.png`);
    $('#promo-b').attr('src', `/public/img/chesspieces/wikipedia/${promoColor}B.png`);
    $('#promo-n').attr('src', `/public/img/chesspieces/wikipedia/${promoColor}N.png`);

    $('#promotion-modal').css('display', 'flex');
}

$('.promotion-option').on('click', function() {
    const selectedPiece = $(this).data('piece');
    $('#promotion-modal').hide();

    if (pendingMove) {
        const promoMove = {
            from: pendingMove.from,
            to: pendingMove.to,
            promotion: selectedPiece
        };
        
        const move = game.move(promoMove);
        if (move) {
            board.position(game.fen());
            socket.emit('makeMove', { move: promoMove });
            updateStatusUI();
        }
        pendingMove = null;
    }
});

// Socket Event Handlers
socket.on('connect', function() {
    if (roomCode) {
        socket.emit('joinRoom', { code: roomCode });
    }
});

socket.on('roomState', function(data) {
    myColor = data.role;
    gameHasStarted = data.gameHasStarted;
    whiteTime = data.whiteTime;
    blackTime = data.blackTime;
    activeTurn = data.turn;

    // Load FEN state
    game.load(data.fen);
    
    // Set Board configuration
    const config = {
        draggable: true,
        position: data.fen || 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
    };
    board = Chessboard('myBoard', config);

    // Flip board if player is playing Black
    if (myColor === 'black') {
        board.flip();
    }

    // Update UI elements
    $('#roleBadge').text(`Role: ${myColor.charAt(0).toUpperCase() + myColor.slice(1)}`);
    
    // Set invite link input
    const inviteLink = `${window.location.origin}/game?code=${roomCode}`;
    $('#inviteLinkInput').val(inviteLink);

    // Populate chat history
    renderChat(data.chat);
    
    updateTimersUI();
    updateStatusUI();
    highlightSquares();
});

socket.on('roomStatus', function(data) {
    $('#spectatorBadge').text(`Spectators: ${data.spectatorCount}`);
    
    // Update player connection indicators
    $('#whiteConnState').text(data.whiteConnected ? 'Connected' : 'Disconnected');
    $('#blackConnState').text(data.blackConnected ? 'Connected' : 'Disconnected');

    const wasStarted = gameHasStarted;
    gameHasStarted = data.gameHasStarted;

    if (gameHasStarted && !wasStarted) {
        updateStatusUI();
        updateTimersUI();
    }

    // Handle Disconnect Countdown Overlay
    if (gameHasStarted && !gameOverState) {
        const whiteGone = !data.whiteConnected;
        const blackGone = !data.blackConnected;

        if ((myColor === 'white' && blackGone) || (myColor === 'black' && whiteGone)) {
            // Opponent disconnected, show forfeit warning timer overlay
            showDisconnectOverlay(myColor === 'white' ? 'Black player' : 'White player');
        } else {
            // Everyone is connected, hide overlay
            hideDisconnectOverlay();
            updateStatusUI();
            updateTimersUI();
        }
    }
});

function showDisconnectOverlay(disconnectedPlayerName) {
    if ($('#disconnectOverlay').css('display') === 'flex') return;

    $('#disconnectOverlayText').text(`${disconnectedPlayerName} disconnected. Waiting for reconnection...`);
    $('#disconnectOverlay').css('display', 'flex');

    let countdown = 30;
    $('#disconnectCountdown').text(countdown);

    clearInterval(disconnectInterval);
    disconnectInterval = setInterval(() => {
        countdown--;
        $('#disconnectCountdown').text(countdown);
        if (countdown <= 0) {
            clearInterval(disconnectInterval);
        }
    }, 1000);
}

function hideDisconnectOverlay() {
    clearInterval(disconnectInterval);
    $('#disconnectOverlay').hide();
}

socket.on('timerUpdate', function(data) {
    whiteTime = data.whiteTime;
    blackTime = data.blackTime;
    activeTurn = data.turn;
    updateTimersUI();
});

socket.on('moveMade', function(data) {
    const localTurn = game.turn();
    const serverTurn = data.turn;

    // Apply move locally if not already done
    if (game.fen() !== data.fen) {
        game.move(data.move);
        board.position(data.fen);
    }

    whiteTime = data.whiteTime;
    blackTime = data.blackTime;
    activeTurn = serverTurn;

    // Determine sound sound types
    let soundType = 'move';
    if (data.move.san.includes('+') || data.move.san.includes('#')) {
        soundType = 'check';
    } else if (data.move.san.includes('x')) {
        soundType = 'capture';
    }
    playSound(soundType);

    updateTimersUI();
    updateStatusUI();
    highlightSquares(data.move);
});

socket.on('gameOver', function(data) {
    gameOverState = true;
    hideDisconnectOverlay();

    let resultText = 'Game Over! ';
    if (data.reason === 'checkmate') {
        resultText += `${data.winner.toUpperCase()} wins by checkmate!`;
    } else if (data.reason === 'timeout') {
        resultText += `${data.winner.toUpperCase()} wins on time!`;
    } else if (data.reason === 'resignation') {
        resultText += `${data.winner.toUpperCase()} wins by resignation.`;
    } else if (data.reason === 'forfeit') {
        resultText += `${data.winner.toUpperCase()} wins by forfeit (opponent disconnected).`;
    } else {
        resultText += 'Draw match.';
    }

    $('#status').text(resultText);
    $('#gameStatus').html(`<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--danger-red); box-shadow: 0 0 8px var(--danger-red);"></span> <span>${resultText}</span>`);
    
    // Trigger check/loss sound if lost/won
    if (data.reason === 'checkmate') {
        playSound('check');
    }
});

// Chat logic
function renderChat(chatList) {
    let html = '';
    for (let m of chatList) {
        let textClass = 'spectator-color';
        let senderName = 'Spectator';

        if (m.color === 'white') {
            textClass = 'white-color';
            senderName = 'White';
        } else if (m.color === 'black') {
            textClass = 'black-color';
            senderName = 'Black';
        } else if (m.color === 'system') {
            textClass = 'system-color';
            senderName = 'System';
        }

        if (m.color === 'system') {
            html += `<div class="chat-message ${textClass}">${m.msg}</div>`;
        } else {
            const label = (m.color === myColor) ? 'You' : senderName;
            html += `<div class="chat-message ${textClass}"><b>${label}:</b> ${m.msg}</div>`;
        }
    }
    
    const $chatBox = $('#chat-messages');
    $chatBox.html(html);
    $chatBox.scrollTop($chatBox[0].scrollHeight);
}

socket.on('chatUpdate', function(data) {
    renderChat(data.chat);
});

function sendChatMessage() {
    const text = $('#chat-input').val().trim();
    if (text) {
        socket.emit('chatMessage', { msg: text });
        $('#chat-input').val('');
    }
}

// Button click handlers
$('#chat-send').on('click', sendChatMessage);
$('#chat-input').on('keypress', function(e) {
    if (e.which === 13) sendChatMessage();
});

$('#resignBtn').on('click', function() {
    if (confirm('Are you sure you want to resign the game?')) {
        socket.emit('resign');
    }
});

$('#lobbyBtn').on('click', function() {
    window.location.replace('/');
});

// Clipboard invitation copy
$('#copyInviteBtn').on('click', function() {
    const input = document.getElementById('inviteLinkInput');
    input.select();
    input.setSelectionRange(0, 99999); // For mobile
    
    navigator.clipboard.writeText(input.value)
        .then(() => {
            const originalText = $(this).text();
            $(this).text('Copied!');
            setTimeout(() => $(this).text(originalText), 2000);
        })
        .catch(err => {
            console.error('Could not copy link', err);
        });
});