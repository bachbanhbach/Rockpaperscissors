// ===== OTTv2 - Game Logic + playhtml.fun Multiplayer =====

const ROWS = 9;
const COLS = 9;

// Piece types
const ROCK = 'rock';
const PAPER = 'paper';
const SCISSORS = 'scissors';

// SVG icons for each piece type
const PIECE_SVG = {
    [ROCK]: `<svg viewBox="0 0 24 24"><path d="M5.5 10.5c0-1 .7-2 1.5-2.5V6.5a2 2 0 0 1 2-2c.4 0 .8.1 1.1.3A2 2 0 0 1 12 3.5a2 2 0 0 1 1.9 1.3c.3-.2.7-.3 1.1-.3a2 2 0 0 1 2 2v.5c.5.3 1 .8 1.2 1.5l.3 1.5v3a5 5 0 0 1-2 4l-1 .8a3 3 0 0 1-1.8.7H10a3 3 0 0 1-2.1-.9l-1.5-1.5A5 5 0 0 1 5.5 13z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="9" y1="5" x2="9" y2="9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="4.5" x2="12" y2="9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="15" y1="5" x2="15" y2="9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    [PAPER]: `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="8.5" y1="8" x2="15.5" y2="8" stroke="currentColor" stroke-width="2"/><line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" stroke-width="2"/><line x1="8.5" y1="16" x2="13" y2="16" stroke="currentColor" stroke-width="2"/></svg>`,
    [SCISSORS]: `<svg viewBox="0 0 24 24"><circle cx="7" cy="17" r="2.8" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17" cy="17" r="2.8" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="9.2" y1="15" x2="17" y2="5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="14.8" y1="15" x2="7" y2="5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`
};

const TYPE_NAMES = {
    [ROCK]: 'Đấm',
    [PAPER]: 'Lá',
    [SCISSORS]: 'Kéo'
};

const TYPE_EMOJI = {
    [ROCK]: '✊',
    [PAPER]: '✋',
    [SCISSORS]: '✌️'
};

// Game State
let board = [];
let currentPlayer = 1; // 1: Blue, 2: Red
let selectedPiece = null;
let lastMove = null;
let moveHistory = [];
let capturedByBlue = []; // pieces Blue captured from Red
let capturedByRed = [];  // pieces Red captured from Blue
let gameOver = false;
let players = { blue: null, red: null };

// Local Player State
let localPlayerId = localStorage.getItem('ottv2_player_id');
if (!localPlayerId) {
    localPlayerId = Math.random().toString(36).substring(2, 12);
    localStorage.setItem('ottv2_player_id', localPlayerId);
}
let myRole = 0; // 0 = Viewer, 1 = Blue, 2 = Red

function updateRoleUI() {
    const blueName = document.getElementById('blue-name');
    const redName = document.getElementById('red-name');
    if (!blueName || !redName) return;
    
    if (myRole === 1) {
        blueName.textContent = 'Đội Xanh (Bạn)';
        redName.textContent = 'Đội Đỏ';
    } else if (myRole === 2) {
        blueName.textContent = 'Đội Xanh';
        redName.textContent = 'Đội Đỏ (Bạn)';
    } else {
        blueName.textContent = 'Đội Xanh';
        redName.textContent = 'Đội Đỏ';
    }
}

// ===== Board Initialization =====
// Piece positions from the reference image (meaf.us/rps2)
// Board coordinates: r=0 is top (row 9), c=0 is left (col A)
// Blue: bottom-left diagonal | Red: top-right diagonal (mirror)

function getInitialPieces() {
    // Blue (Player 1) - bottom-left staircase
    const p1 = [
        { r: 4, c: 1, t: PAPER },    // B5
        { r: 4, c: 2, t: SCISSORS }, // C5
        { r: 5, c: 1, t: ROCK },     // B4
        { r: 5, c: 2, t: PAPER },    // C4
        { r: 5, c: 3, t: SCISSORS }, // D4
        { r: 6, c: 2, t: ROCK },     // C3
        { r: 6, c: 3, t: PAPER },    // D3
        { r: 6, c: 4, t: SCISSORS }, // E3
        { r: 7, c: 3, t: ROCK },     // D2
        { r: 7, c: 4, t: PAPER },    // E2
    ];

    // Red (Player 2) - top-right staircase (180° mirror of Blue)
    const p2 = [
        { r: 4, c: 6, t: SCISSORS }, // G5
        { r: 4, c: 7, t: PAPER },    // H5
        { r: 3, c: 5, t: SCISSORS }, // F6
        { r: 3, c: 6, t: PAPER },    // G6
        { r: 3, c: 7, t: ROCK },     // H6
        { r: 2, c: 4, t: SCISSORS }, // E7
        { r: 2, c: 5, t: PAPER },    // F7
        { r: 2, c: 6, t: ROCK },     // G7
        { r: 1, c: 4, t: PAPER },    // E8
        { r: 1, c: 5, t: ROCK },     // F8
    ];

    return { p1, p2 };
}

function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    const { p1, p2 } = getInitialPieces();
    p1.forEach(p => board[p.r][p.c] = { player: 1, type: p.t });
    p2.forEach(p => board[p.r][p.c] = { player: 2, type: p.t });
}

// ===== Capture Rules (RPS) =====
function canCapture(attackerType, defenderType) {
    if (attackerType === defenderType) return false; // Same type = block
    if (attackerType === ROCK && defenderType === SCISSORS) return true;
    if (attackerType === SCISSORS && defenderType === PAPER) return true;
    if (attackerType === PAPER && defenderType === ROCK) return true;
    return false;
}

// ===== Move Validation =====
function isValidMove(sr, sc, dr, dc) {
    const rowDiff = Math.abs(dr - sr);
    const colDiff = Math.abs(dc - sc);
    // King-like movement: 1 step in any of 8 directions
    if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) return false;

    const myPiece = board[sr][sc];
    const targetPiece = board[dr][dc];

    if (!targetPiece) return true; // Empty cell = valid
    if (targetPiece.player === myPiece.player) return false; // Own piece = blocked
    return canCapture(myPiece.type, targetPiece.type); // Enemy = check RPS
}

// ===== Coordinate Helpers =====
function toNotation(r, c) {
    const col = String.fromCharCode(65 + c); // A-I
    const row = 9 - r; // 1-9
    return col + row;
}

// ===== Drawing =====
function drawBoard() {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;

            // Goal squares
            if (r === 8 && c === 0) cell.classList.add('goal-blue');  // A1
            if (r === 0 && c === 8) cell.classList.add('goal-red');   // I9

            // Selected highlight
            if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                cell.classList.add('selected');
            }

            // Last move highlight
            if (lastMove) {
                if (lastMove.fromR === r && lastMove.fromC === c) cell.classList.add('last-move-from');
                if (lastMove.toR === r && lastMove.toC === c) cell.classList.add('last-move-to');
            }

            // Valid move / capturable indicators
            if (selectedPiece) {
                if (isValidMove(selectedPiece.r, selectedPiece.c, r, c)) {
                    const target = board[r][c];
                    if (target && target.player !== board[selectedPiece.r][selectedPiece.c].player) {
                        cell.classList.add('capturable');
                    } else if (!target) {
                        cell.classList.add('valid-move');
                    }
                }
            }

            // Click handler
            cell.onclick = () => handleCellClick(r, c);

            // Piece
            const piece = board[r][c];
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.classList.add('piece', piece.player === 1 ? 'piece-blue' : 'piece-red', piece.type);

                const iconDiv = document.createElement('div');
                iconDiv.classList.add('piece-icon');
                iconDiv.innerHTML = PIECE_SVG[piece.type];
                pieceDiv.appendChild(iconDiv);

                cell.appendChild(pieceDiv);
            }

            // Move dot (for valid-move cells without pieces)
            if (!piece || (selectedPiece && isValidMove(selectedPiece.r, selectedPiece.c, r, c) && !board[r][c])) {
                const dot = document.createElement('div');
                dot.classList.add('move-dot');
                cell.appendChild(dot);
            }

            boardDiv.appendChild(cell);
        }
    }
}

// ===== Click Handler =====
function handleCellClick(r, c) {
    if (gameOver) return;

    // Turn & Role Enforcement
    if (myRole !== 1 && myRole !== 2) {
        // You are a spectator, you cannot play
        alert("Bạn đang là người xem (Phòng đã đủ 2 người chơi).");
        return;
    }
    if (myRole !== currentPlayer) {
        // Not your turn
        return;
    }

    const clickedPiece = board[r][c];

    // If no piece selected, select current player's piece
    if (!selectedPiece) {
        if (clickedPiece && clickedPiece.player === currentPlayer) {
            selectedPiece = { r, c };
            drawBoard();
        }
        return;
    }

    const sr = selectedPiece.r;
    const sc = selectedPiece.c;

    // Click same piece = deselect
    if (sr === r && sc === c) {
        selectedPiece = null;
        drawBoard();
        return;
    }

    // Click another own piece = reselect
    if (clickedPiece && clickedPiece.player === currentPlayer) {
        selectedPiece = { r, c };
        drawBoard();
        return;
    }

    // Attempt move
    if (isValidMove(sr, sc, r, c)) {
        executeMove(sr, sc, r, c);
    } else {
        selectedPiece = null;
        drawBoard();
    }
}

// ===== Execute Move =====
function executeMove(sr, sc, dr, dc) {
    const movingPiece = board[sr][sc];
    const capturedPiece = board[dr][dc];
    const isCapture = capturedPiece !== null;

    // Record move
    const moveRecord = {
        player: currentPlayer,
        pieceType: movingPiece.type,
        from: toNotation(sr, sc),
        to: toNotation(dr, dc),
        capture: isCapture ? capturedPiece.type : null
    };
    moveHistory.push(moveRecord);

    // Track captures
    if (isCapture) {
        if (currentPlayer === 1) {
            capturedByBlue.push(capturedPiece.type);
        } else {
            capturedByRed.push(capturedPiece.type);
        }
    }

    // Move piece
    board[dr][dc] = board[sr][sc];
    board[sr][sc] = null;

    // Record last move
    lastMove = { fromR: sr, fromC: sc, toR: dr, toC: dc };
    selectedPiece = null;

    // Update UI
    drawBoard();
    updateCapturedPanels();
    addMoveToHistory(moveRecord);

    // Check win
    if (checkWin()) {
        gameOver = true;
        return;
    }

    // Switch turn
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnIndicator();

    // Sync state via playhtml
    syncState();
}

// ===== Win Condition =====
function checkWin() {
    // Win by reaching opponent's goal
    // Blue (player 1) wins by reaching I9 (r=0, c=8)
    const pieceAtI9 = board[0][8];
    if (pieceAtI9 && pieceAtI9.player === 1) {
        showWin(1, 'Đội Xanh đã chiếm ô I9!');
        return true;
    }
    // Red (player 2) wins by reaching A1 (r=8, c=0)
    const pieceAtA1 = board[8][0];
    if (pieceAtA1 && pieceAtA1.player === 2) {
        showWin(2, 'Đội Đỏ đã chiếm ô A1!');
        return true;
    }

    // Win by eliminating all of one type
    let p1Counts = { [ROCK]: 0, [PAPER]: 0, [SCISSORS]: 0 };
    let p2Counts = { [ROCK]: 0, [PAPER]: 0, [SCISSORS]: 0 };

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (p) {
                if (p.player === 1) p1Counts[p.type]++;
                else p2Counts[p.type]++;
            }
        }
    }

    // Check if Blue lost all of one type
    if (p1Counts[ROCK] === 0 || p1Counts[PAPER] === 0 || p1Counts[SCISSORS] === 0) {
        const eliminated = Object.entries(p1Counts).find(([_, count]) => count === 0);
        showWin(2, `Đội Đỏ đã tiêu diệt hết ${TYPE_NAMES[eliminated[0]]} của Đội Xanh!`);
        return true;
    }
    // Check if Red lost all of one type
    if (p2Counts[ROCK] === 0 || p2Counts[PAPER] === 0 || p2Counts[SCISSORS] === 0) {
        const eliminated = Object.entries(p2Counts).find(([_, count]) => count === 0);
        showWin(1, `Đội Xanh đã tiêu diệt hết ${TYPE_NAMES[eliminated[0]]} của Đội Đỏ!`);
        return true;
    }

    return false;
}

function showWin(player, reason) {
    const overlay = document.getElementById('win-overlay');
    const title = document.getElementById('win-title');
    const reasonEl = document.getElementById('win-reason');

    if (player === 1) {
        title.innerHTML = '🏆 Đội Xanh thắng!';
        title.style.color = 'var(--theme-blue)';
    } else {
        title.innerHTML = '🏆 Đội Đỏ thắng!';
        title.style.color = 'var(--theme-red)';
    }
    reasonEl.textContent = reason;
    overlay.style.display = 'flex';
}

// ===== UI Updates =====
function updateTurnIndicator() {
    const text = document.getElementById('turn-text');
    const dot = document.getElementById('turn-dot');

    if (currentPlayer === 1) {
        text.textContent = 'Lượt: Đội Xanh';
        dot.classList.remove('red');
    } else {
        text.textContent = 'Lượt: Đội Đỏ';
        dot.classList.add('red');
    }
}

function updateCapturedPanels() {
    const bluePanel = document.getElementById('captured-by-blue');
    const redPanel = document.getElementById('captured-by-red');

    bluePanel.innerHTML = capturedByBlue.length === 0
        ? ''
        : capturedByBlue.map(t => `<span class="captured-piece" style="color: var(--theme-red);">${TYPE_EMOJI[t]}</span>`).join('');

    redPanel.innerHTML = capturedByRed.length === 0
        ? ''
        : capturedByRed.map(t => `<span class="captured-piece" style="color: var(--theme-blue);">${TYPE_EMOJI[t]}</span>`).join('');
}

function addMoveToHistory(move) {
    const grid = document.getElementById('history-grid');
    const countEl = document.getElementById('move-count');

    // Remove empty message
    const empty = grid.querySelector('.live-panel-empty');
    if (empty) empty.remove();

    const moveNum = moveHistory.length;
    const card = document.createElement('div');
    card.classList.add('history-move-card', move.player === 1 ? 'blue-move' : 'red-move');

    const playerColor = move.player === 1 ? 'var(--theme-blue)' : 'var(--theme-red)';
    const captureText = move.capture
        ? ` ×${TYPE_EMOJI[move.capture]}`
        : '';

    card.innerHTML = `
        <span class="history-move-number">${moveNum}.</span>
        <div class="history-move-text">
            <span class="history-piece-icon" style="color: ${playerColor}">
                ${PIECE_SVG[move.pieceType]}
            </span>
            <span>${move.from} → ${move.to}${captureText}</span>
        </div>
    `;

    grid.appendChild(card);
    countEl.textContent = `${moveNum} nước`;

    // Scroll to bottom
    grid.scrollTop = grid.scrollHeight;
}

// ===== PlayHTML Sync =====
let lastSyncedState = "";

function syncState() {
    const syncEl = document.getElementById('game-sync');
    if (syncEl) {
        const stateStr = JSON.stringify({
            players: players,
            board: board,
            currentPlayer: currentPlayer,
            lastMove: lastMove,
            moveHistory: moveHistory,
            capturedByBlue: capturedByBlue,
            capturedByRed: capturedByRed,
            gameOver: gameOver,
            timestamp: Date.now()
        });
        
        if (lastSyncedState !== stateStr) {
            lastSyncedState = stateStr;
            syncEl.value = stateStr;
            // Dispatch input event so playhtml detects the change
            syncEl.dispatchEvent(new Event('input', { bubbles: true }));
            syncEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

function pollSyncState() {
    const syncEl = document.getElementById('game-sync');
    if (!syncEl) return;
    
    const currentValue = syncEl.value;
    if (currentValue && currentValue !== lastSyncedState) {
        try {
            const state = JSON.parse(currentValue);
            if (!state.board) return;
            
            // Only update if it's actually a newer state or if we don't have one
            // We can check timestamp just to be safe, but exact string match is enough
            lastSyncedState = currentValue;
            
            players = state.players || { blue: null, red: null };
            board = state.board;
            currentPlayer = state.currentPlayer;
            lastMove = state.lastMove;
            moveHistory = state.moveHistory || [];
            capturedByBlue = state.capturedByBlue || [];
            capturedByRed = state.capturedByRed || [];
            gameOver = state.gameOver || false;

            checkAndClaimRole();

            drawBoard();
            updateTurnIndicator();
            updateCapturedPanels();
            rebuildHistory();
        } catch (e) {
            console.error("Failed to parse sync state", e);
        }
    }
}

function checkAndClaimRole() {
    let needsSync = false;
    
    if (players.blue === localPlayerId) {
        myRole = 1;
    } else if (players.red === localPlayerId) {
        myRole = 2;
    } else {
        // Try to claim an empty seat
        if (!players.blue) {
            players.blue = localPlayerId;
            myRole = 1;
            needsSync = true;
        } else if (!players.red) {
            players.red = localPlayerId;
            myRole = 2;
            needsSync = true;
        } else {
            myRole = 0; // Spectator
        }
    }
    
    updateRoleUI();
    if (needsSync) {
        syncState();
    }
}

function rebuildHistory() {
    const grid = document.getElementById('history-grid');
    const countEl = document.getElementById('move-count');
    if (!grid) return;
    grid.innerHTML = '';

    if (moveHistory.length === 0) {
        grid.innerHTML = '<div class="live-panel-empty">Chưa có nước đi nào</div>';
        countEl.textContent = '0 nước';
        return;
    }

    moveHistory.forEach((move, i) => {
        const card = document.createElement('div');
        card.classList.add('history-move-card', move.player === 1 ? 'blue-move' : 'red-move');
        const playerColor = move.player === 1 ? 'var(--theme-blue)' : 'var(--theme-red)';
        const captureText = move.capture ? ` ×${TYPE_EMOJI[move.capture]}` : '';
        card.innerHTML = `
            <span class="history-move-number">${i + 1}.</span>
            <div class="history-move-text">
                <span class="history-piece-icon" style="color: ${playerColor}">
                    ${PIECE_SVG[move.pieceType]}
                </span>
                <span>${move.from} → ${move.to}${captureText}</span>
            </div>
        `;
        grid.appendChild(card);
    });
    countEl.textContent = `${moveHistory.length} nước`;
    grid.scrollTop = grid.scrollHeight;
}

// ===== Reset =====
function resetGame() {
    // Hide win modal
    const winOverlay = document.getElementById('win-overlay');
    if (winOverlay) winOverlay.style.display = 'none';

    // Reset state
    initBoard();
    currentPlayer = 1;
    selectedPiece = null;
    lastMove = null;
    moveHistory = [];
    capturedByBlue = [];
    capturedByRed = [];
    gameOver = false;

    // Update UI
    drawBoard();
    updateTurnIndicator();
    updateCapturedPanels();
    rebuildHistory();

    // Sync
    syncState();
}

function setupSyncObserver() {
    // PlayHTML updates textarea value, which might not trigger standard DOM events we can listen to
    // depending on how it's implemented internally. 
    // Polling is a robust fallback for game state sync.
    setInterval(pollSyncState, 300);
}

// ===== Initialize =====
function init() {
    initBoard();
    drawBoard();
    updateTurnIndicator();

    // Try to claim role in a new room if playhtml doesn't sync any existing state
    setTimeout(() => {
        if (!lastSyncedState) {
            checkAndClaimRole();
        }
    }, 1500);

    setupSyncObserver();
}

// Start
init();
