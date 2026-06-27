// Piece-Square Tables (PST) for Positional AI Evaluation
// From White's perspective (mirrored for Black)
const pawnEval = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0,  1.0, -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

const knightEval = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

const bishopEval = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
    [-1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
    [-1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
    [-1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
    [-1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const rookEval = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [0.0,   0.0,  0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

const queenEval = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [0.0,   0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [-1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.0,  0.0,  0.5,  0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const kingEval = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [ 2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0],
    [ 2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0]
];

class ChessAI {
    getBestMove(game, difficulty) {
        let moves = game.moves({ verbose: true });
        if (moves.length === 0) return null;

        if (difficulty === 'easy') {
            // Easy Mode: mostly random, occasionally captures
            const captures = moves.filter(m => m.captured);
            if (captures.length > 0 && Math.random() < 0.25) {
                return captures[Math.floor(Math.random() * captures.length)];
            }
            return moves[Math.floor(Math.random() * moves.length)];
        }

        const depth = difficulty === 'intermediate' ? 2 : 3;
        const color = game.turn() === 'w' ? 1 : -1;

        // Move sorting
        moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            if (a.captured) scoreA += 10;
            if (b.captured) scoreB += 10;
            if (a.flags.includes('p')) scoreA += 20;
            if (b.flags.includes('p')) scoreB += 20;
            return scoreB - scoreA;
        });

        let bestMove = null;
        let bestValue = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (let move of moves) {
            game.move(move);
            let boardValue = -this.negamax(game, depth - 1, -beta, -alpha, -color);
            game.undo();

            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
            alpha = Math.max(alpha, boardValue);
        }
        return bestMove;
    }

    negamax(game, depth, alpha, beta, color) {
        if (depth === 0 || game.game_over()) {
            return color * this.evaluateBoard(game);
        }

        let moves = game.moves({ verbose: true });
        // Simple move ordering
        moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            if (a.captured) scoreA += 10;
            if (b.captured) scoreB += 10;
            if (a.flags.includes('p')) scoreA += 20;
            if (b.flags.includes('p')) scoreB += 20;
            return scoreB - scoreA;
        });

        let maxEval = -Infinity;
        for (let move of moves) {
            game.move(move);
            let score = -this.negamax(game, depth - 1, -beta, -alpha, -color);
            game.undo();

            maxEval = Math.max(maxEval, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break; // Beta cutoff
        }
        return maxEval;
    }

    evaluateBoard(game) {
        const board = game.board();
        let score = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    let pieceVal = 0;
                    let pstScore = 0;

                    switch (piece.type) {
                        case 'p':
                            pieceVal = 100;
                            pstScore = pawnEval[piece.color === 'w' ? r : 7 - r][c];
                            break;
                        case 'n':
                            pieceVal = 320;
                            pstScore = knightEval[piece.color === 'w' ? r : 7 - r][c];
                            break;
                        case 'b':
                            pieceVal = 330;
                            pstScore = bishopEval[piece.color === 'w' ? r : 7 - r][c];
                            break;
                        case 'r':
                            pieceVal = 500;
                            pstScore = rookEval[piece.color === 'w' ? r : 7 - r][c];
                            break;
                        case 'q':
                            pieceVal = 900;
                            pstScore = queenEval[piece.color === 'w' ? r : 7 - r][c];
                            break;
                        case 'k':
                            pieceVal = 20000;
                            pstScore = kingEval[piece.color === 'w' ? r : 7 - r][c];
                            break;
                    }

                    const totalVal = pieceVal + pstScore * 10;
                    if (piece.color === 'w') {
                        score += totalVal;
                    } else {
                        score -= totalVal;
                    }
                }
            }
        }
        return score;
    }
}

// UI Game Client logic
$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    let difficulty = urlParams.get('difficulty') || 'easy';
    let humanColor = 'w'; // 'w' or 'b'
    let pendingMove = null;

    const game = new Chess();
    const ai = new ChessAI();
    let board = null;

    // Audio Synth
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
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(783.99, now + 0.08);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            }
        } catch (e) {}
    }

    // Highlights
    function highlightSquares(move) {
        $('.square-55d63').removeClass('highlight-move highlight-check');
        if (move) {
            $(`.square-${move.from}`).addClass('highlight-move');
            $(`.square-${move.to}`).addClass('highlight-move');
        }
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

    // Status UI
    function updateStatusUI() {
        let status = '';
        if (game.in_checkmate()) {
            status = 'Game over! ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins by checkmate!';
            $('#aiStatus').html(`<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--danger-red);"></span> <span>Checkmate!</span>`);
        } else if (game.in_draw()) {
            status = 'Game drawn!';
            $('#aiStatus').html(`<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--text-secondary);"></span> <span>Draw Game</span>`);
        } else {
            const isUserTurn = game.turn() === humanColor;
            status = isUserTurn ? 'Your turn' : 'AI thinking...';
            const colorGlow = isUserTurn ? 'var(--accent-gold)' : 'var(--text-secondary)';
            $('#aiStatus').html(`<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${colorGlow}; box-shadow: 0 0 8px ${colorGlow};"></span> <span>${status}</span>`);
        }

        $('#status').text(status);
        $('#pgn').text(game.pgn() || 'No moves played yet.');
    }

    // Chessboard drag handlers
    function onDragStart(source, piece, position, orientation) {
        if (game.game_over()) return false;
        // Block player from picking up AI pieces or moving out of turn
        if (game.turn() !== humanColor) return false;
        if (piece[0] !== humanColor) return false;
    }

    function onDrop(source, target) {
        initAudio();
        const pieceObj = game.get(source);

        // Check for Pawn Promotion
        if (pieceObj && pieceObj.type === 'p') {
            const isPromoRank = (pieceObj.color === 'w' && target.endsWith('8')) || 
                               (pieceObj.color === 'b' && target.endsWith('1'));
            if (isPromoRank) {
                const moves = game.moves({ verbose: true });
                const isLegal = moves.some(m => m.from === source && m.to === target && m.flags.includes('p'));
                if (isLegal) {
                    pendingMove = { from: source, to: target };
                    showPromotionModal(pieceObj.color);
                    return;
                }
            }
        }

        const moveObj = { from: source, to: target };
        const move = game.move(moveObj);
        if (move === null) return 'snapback';

        // Play Move Sound
        let soundType = move.san.includes('+') || move.san.includes('#') ? 'check' : (move.san.includes('x') ? 'capture' : 'move');
        playSound(soundType);

        updateStatusUI();
        highlightSquares(move);

        // Trigger AI move
        setTimeout(makeAIMove, 250);
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    // Pawn Promotion Dialog
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
                playSound('move');
                updateStatusUI();
                highlightSquares(move);

                // Trigger AI move
                setTimeout(makeAIMove, 250);
            }
            pendingMove = null;
        }
    });

    // Make AI Move
    function makeAIMove() {
        if (game.game_over()) return;

        const aiMove = ai.getBestMove(game, difficulty);
        if (aiMove) {
            const move = game.move(aiMove);
            board.position(game.fen());

            // Play AI Move Sound
            let soundType = move.san.includes('+') || move.san.includes('#') ? 'check' : (move.san.includes('x') ? 'capture' : 'move');
            playSound(soundType);

            updateStatusUI();
            highlightSquares(move);
        }
    }

    // Setup difficulty display
    function updateDifficultyUI() {
        const diffTextMap = {
            'easy': 'Easy Mode (Random)',
            'intermediate': 'Intermediate Mode (Positional)',
            'hard': 'Hard Mode (Tactical)'
        };
        $('#selectedDiffText').text(diffTextMap[difficulty]);
        $('#difficultyBadge').text('Difficulty: ' + difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
    }

    // Difficulty dropdown controls
    $('#aiLevelSelectBtn').on('click', function(e) {
        e.stopPropagation();
        $('#aiLevelDropdown').fadeToggle(150);
    });

    $(document).on('click', function() {
        $('#aiLevelDropdown').fadeOut(100);
    });

    $('.dropdown-item').on('click', function() {
        difficulty = $(this).data('diff');
        updateDifficultyUI();
        $('#aiLevelDropdown').fadeOut(100);
    });

    // Setup board and controls
    function initGame() {
        const config = {
            draggable: true,
            position: game.fen(),
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
        };
        board = Chessboard('aiBoard', config);

        if (humanColor === 'b') {
            board.flip();
            // Trigger AI's first move if playing as Black
            setTimeout(makeAIMove, 400);
        }

        $('#aiColorBadge').text('Color: ' + (humanColor === 'w' ? 'White' : 'Black'));
        updateDifficultyUI();
        updateStatusUI();
    }

    // Buttons actions
    $('#ai-flip').on('click', function() {
        board.flip();
    });

    $('#ai-restart').on('click', function() {
        game.reset();
        board.position('start');
        $('.square-55d63').removeClass('highlight-move highlight-check');
        updateStatusUI();
        if (humanColor === 'b') {
            setTimeout(makeAIMove, 400);
        }
    });

    $('#playWhiteBtn').on('click', function() {
        if (humanColor === 'w') return;
        humanColor = 'w';
        $(this).removeClass('btn-secondary').addClass('btn-primary');
        $('#playBlackBtn').removeClass('btn-primary').addClass('btn-secondary');
        
        game.reset();
        $('.square-55d63').removeClass('highlight-move highlight-check');
        initGame();
    });

    $('#playBlackBtn').on('click', function() {
        if (humanColor === 'b') return;
        humanColor = 'b';
        $(this).removeClass('btn-secondary').addClass('btn-primary');
        $('#playWhiteBtn').removeClass('btn-primary').addClass('btn-secondary');
        
        game.reset();
        $('.square-55d63').removeClass('highlight-move highlight-check');
        initGame();
    });

    $('#ai-undo').on('click', function() {
        // In player vs AI, click undo should revert 2 moves (both AI's move and player's move)
        // unless it's only AI's turn at start of match
        if (game.history().length >= 2) {
            game.undo();
            game.undo();
            board.position(game.fen());
            $('.square-55d63').removeClass('highlight-move highlight-check');
            updateStatusUI();
        } else if (game.history().length === 1 && humanColor === 'b') {
            // AI made first move, undo it
            game.undo();
            board.position(game.fen());
            $('.square-55d63').removeClass('highlight-move highlight-check');
            updateStatusUI();
        }
    });

    $('#lobbyBtn').on('click', function() {
        window.location.replace('/');
    });

    // Run initialization
    initGame();
});
