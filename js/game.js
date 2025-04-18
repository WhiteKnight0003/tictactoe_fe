/**
 * Tic Tac Toe Game Logic
 * 20x20 board with 5-in-a-row winning condition
 */
class TicTacToeGame {
    constructor() {
        this.board = Array(20).fill().map(() => Array(20).fill(''));
        this.currentSymbol = 'X';
        this.playerSymbol = 'X';
        this.aiSymbol = 'O';
        this.gameActive = false;
        this.difficulty = 'easy';
        this.winningLength = 5; // 5 in a row to win
        this.winningCells = [];
        this.timerDuration = 15 * 60; // 15 minutes in seconds
        this.timeRemaining = this.timerDuration;
        this.timerInterval = null;
        // Giữ nguyên code hiện tại và thêm dòng sau:
        this.lastAiMove = null; // Lưu nước đi mới nhất của AI
    }

    /**
     * Initialize the game with player options
     * @param {string} playerSymbol - 'X' or 'O'
     * @param {string} difficulty - 'easy' or 'hard'
     */
    init(playerSymbol, difficulty) {
        // Reset the game state
        this.board = Array(20).fill().map(() => Array(20).fill(''));
        this.playerSymbol = playerSymbol;
        this.aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
        this.currentSymbol = 'X'; // X always starts
        this.difficulty = difficulty;
        this.gameActive = true;
        this.winningCells = [];
        
        // Reset timer
        this.stopTimer();
        this.timeRemaining = this.timerDuration;
        this.startTimer();
        
        // If AI starts
        if (this.currentSymbol === this.aiSymbol) {
            setTimeout(() => {
                this.makeAiMove();
            }, 500);
        }
        
        return {
            board: this.board,
            currentPlayer: this.currentSymbol,
            timeRemaining: this.formatTime(this.timeRemaining)
        };
    }

    /**
     * Make a move on the board
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object} Game state after move
     */
    makeMove(row, col) {
        // Check if the move is valid
        if (!this.gameActive || this.board[row][col] !== '') {
            return {
                valid: false,
                message: "Invalid move. Try again."
            };
        }

        // Place the symbol on the board
        this.board[row][col] = this.currentSymbol;
        
        // Check for win
        if (this.checkWin(row, col)) {
            this.gameActive = false;
            this.stopTimer();
            return {
                valid: true,
                gameOver: true,
                winner: this.currentSymbol,
                winningCells: this.winningCells,
                message: `Player ${this.currentSymbol} wins!`,
                board: this.board,
                currentPlayer: this.currentSymbol
            };
        }
        
        // Check for draw
        if (this.checkDraw()) {
            this.gameActive = false;
            this.stopTimer();
            return {
                valid: true,
                gameOver: true,
                draw: true,
                message: "Game ended in a draw!",
                board: this.board,
                currentPlayer: this.currentSymbol
            };
        }
        
        // Switch players
        this.currentSymbol = this.currentSymbol === 'X' ? 'O' : 'X';
        
        // If it's the AI's turn
        const result = {
            valid: true,
            board: this.board,
            currentPlayer: this.currentSymbol,
            timeRemaining: this.formatTime(this.timeRemaining)
        };
        
        // Add AI move info if applicable
        if (this.currentSymbol === this.aiSymbol && this.gameActive) {
            result.aiMove = true;
        }
        
        return result;
    }
    
    /**
     * Make an AI move based on difficulty
     */
    makeAiMove() {
        if (!this.gameActive) return null;
        
        let move;
        if (this.difficulty === 'easy') {
            move = this.makeEasyAIMove();
        } else {
            move = this.makeHardAIMove();
        }
        
        if (move) {
            // Lưu nước đi mới nhất của AI
            this.lastAiMove = move;
            return this.makeMove(move.row, move.col);
        }
        return null;
    }
    
    /**
     * Make a random move for easy AI
     */
    makeEasyAIMove() {
        const emptyCells = [];
        
        // Find all empty cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === '') {
                    emptyCells.push({row, col});
                }
            }
        }
        
        // Return a random empty cell
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            return emptyCells[randomIndex];
        }
        
        return null;
    }
    
    /**
     * Make a strategic move for hard AI
     */
    makeHardAIMove() {
        // First check if AI can win in one move
        const winMove = this.findWinningMove(this.aiSymbol);
        if (winMove) return winMove;
        
        // Then check if we need to block player's winning move
        const blockMove = this.findWinningMove(this.playerSymbol);
        if (blockMove) return blockMove;
        
        // If no immediate win/block, use enhanced strategic evaluation
        return this.findEnhancedStrategicMove();
    }
    
    /**
     * Find a winning move for the given symbol
     * @param {string} symbol - 'X' or 'O'
     */
    findWinningMove(symbol) {
        // Check all empty cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === '') {
                    // Temporarily place the symbol
                    this.board[row][col] = symbol;
                    
                    // Check if this creates a win
                    const isWinning = this.checkWin(row, col, true);
                    
                    // Undo the move
                    this.board[row][col] = '';
                    
                    if (isWinning) {
                        return {row, col};
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * Find the best strategic move using enhanced heuristics
     */
    findEnhancedStrategicMove() {
        // Initialize score board
        const scores = Array(20).fill().map(() => Array(20).fill(0));
        
        // Find cells worth considering (near existing moves)
        const candidateMoves = this.findCandidateMoves();
        
        // If first few moves of the game and no candidates, prefer center region
        if (candidateMoves.length === 0) {
            const centerRow = Math.floor(Math.random() * 6) + 7; // 7-12
            const centerCol = Math.floor(Math.random() * 6) + 7; // 7-12
            return {row: centerRow, col: centerCol};
        }
        
        // Score candidate positions
        for (const {row, col} of candidateMoves) {
            scores[row][col] = this.enhancedScorePosition(row, col);
        }
        
        // Find cell with highest score
        let maxScore = -Infinity;
        let bestMoves = [];
        
        for (const {row, col} of candidateMoves) {
            if (scores[row][col] > maxScore) {
                maxScore = scores[row][col];
                bestMoves = [{row, col}];
            } else if (scores[row][col] === maxScore) {
                bestMoves.push({row, col});
            }
        }
        
        // If we found good moves, choose one at random
        if (bestMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * bestMoves.length);
            return bestMoves[randomIndex];
        }
        
        // Fallback to easy AI if no good move found
        return this.makeEasyAIMove();
    }
    
    /**
     * Find candidate moves (empty cells near existing pieces)
     * @returns {Array} List of candidate moves {row, col}
     */
    findCandidateMoves() {
        const candidates = new Set();
        const proximity = 2; // Consider cells within 2 spaces of existing moves
        
        // Iterate through the board to find existing pieces
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] !== '') {
                    // Add empty neighbors to candidates
                    for (let dr = -proximity; dr <= proximity; dr++) {
                        for (let dc = -proximity; dc <= proximity; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            
                            // Check bounds and that cell is empty
                            if (newRow >= 0 && newRow < 20 && 
                                newCol >= 0 && newCol < 20 && 
                                this.board[newRow][newCol] === '') {
                                // Store as string to use Set's uniqueness property
                                candidates.add(`${newRow},${newCol}`);
                            }
                        }
                    }
                }
            }
        }
        
        // Convert back to array of objects
        const result = [];
        candidates.forEach(coord => {
            const [row, col] = coord.split(',').map(Number);
            result.push({row, col});
        });
        
        return result;
    }
    
    /**
     * Enhanced scoring function for board positions
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number} Position score
     */
    enhancedScorePosition(row, col) {
        let aiScore = 0;
        let playerScore = 0;
        
        // Directions: horizontal, vertical, diagonal, anti-diagonal
        const directions = [
            [{row: 0, col: 1}, {row: 0, col: -1}],  // horizontal
            [{row: 1, col: 0}, {row: -1, col: 0}],  // vertical
            [{row: 1, col: 1}, {row: -1, col: -1}], // diagonal
            [{row: 1, col: -1}, {row: -1, col: 1}]  // anti-diagonal
        ];
        
        // Check each direction for patterns
        for (const dirPair of directions) {
            // Evaluate AI's potential in this direction
            const aiPatterns = this.evaluateDirectionalPatterns(row, col, dirPair, this.aiSymbol);
            aiScore += aiPatterns.score;
            
            // Evaluate player's potential in this direction
            const playerPatterns = this.evaluateDirectionalPatterns(row, col, dirPair, this.playerSymbol);
            playerScore += playerPatterns.score;
            
            // Special case: if player is one move away from winning, block is critical
            if (playerPatterns.threatLevel >= 4) {
                playerScore += 1000;
            }
            
            // Special case: if AI can create a fork (multiple winning threats)
            if (aiPatterns.threatLevel >= 3 && this.detectFork(row, col, this.aiSymbol)) {
                aiScore += 800;
            }
        }
        
        // Balance offense and defense with slight preference for offense
        const finalScore = (aiScore * 1.2) + playerScore;
        
        // Add a small preference for center-ish positions
        const centerDistance = Math.sqrt(Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2));
        const centerBonus = Math.max(0, (10 - centerDistance)) / 2;
        
        return finalScore + centerBonus;
    }
    
    /**
     * Evaluate patterns in a specific direction
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {Array} dirPair - Pair of directions
     * @param {string} symbol - Symbol to evaluate for
     * @returns {Object} Pattern evaluation {score, threatLevel}
     */
    evaluateDirectionalPatterns(row, col, dirPair, symbol) {
        let score = 0;
        let maxConsecutive = 0;
        let openEnds = 0;
        
        // Place the symbol temporarily
        const originalValue = this.board[row][col];
        this.board[row][col] = symbol;
        
        // Check both directions
        const line = [];
        line.push({row, col}); // Add current position
        
        // Look forward and backward
        for (const dir of dirPair) {
            for (let i = 1; i < 6; i++) { // Look up to 5 spaces in each direction
                const newRow = row + dir.row * i;
                const newCol = col + dir.col * i;
                
                // Check bounds
                if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20) {
                    break;
                }
                
                // Check cell content
                if (this.board[newRow][newCol] === symbol) {
                    line.push({row: newRow, col: newCol});
                } else if (this.board[newRow][newCol] === '') {
                    // Empty space - potential for growth
                    openEnds++;
                    break;
                } else {
                    // Opponent's piece - blocked
                    break;
                }
            }
        }
        
        // Restore the original value
        this.board[row][col] = originalValue;
        
        // Calculate max consecutive pieces
        maxConsecutive = line.length;
        
        // Calculate score based on consecutive pieces and open ends
        if (maxConsecutive >= 5) {
            // Winning move
            score = 10000;
        } else if (maxConsecutive === 4) {
            // Four in a row
            if (openEnds === 2) {
                // Open-four (extremely dangerous)
                score = 5000;
            } else if (openEnds === 1) {
                // Semi-open four (still dangerous)
                score = 1000;
            }
        } else if (maxConsecutive === 3) {
            // Three in a row
            if (openEnds === 2) {
                // Open-three (strong threat)
                score = 500;
            } else if (openEnds === 1) {
                // Semi-open three (moderate threat)
                score = 100;
            }
        } else if (maxConsecutive === 2) {
            // Two in a row
            if (openEnds === 2) {
                // Open-two (potential development)
                score = 50;
            } else if (openEnds === 1) {
                // Semi-open two (minor potential)
                score = 10;
            }
        } else {
            // Single piece
            score = openEnds * 5;
        }
        
        // Calculate threat level (higher means more urgent)
        // Used to identify critical defensive moves
        let threatLevel = maxConsecutive;
        if (openEnds > 0) threatLevel += openEnds;
        
        return { score, threatLevel };
    }
    
    /**
     * Detect if a move creates a fork (multiple winning threats)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} symbol - Symbol to check for
     * @returns {boolean} True if move creates a fork
     */
    detectFork(row, col, symbol) {
        // Place symbol temporarily
        const originalValue = this.board[row][col];
        this.board[row][col] = symbol;
        
        const directions = [
            {row: 0, col: 1},  // horizontal
            {row: 1, col: 0},  // vertical
            {row: 1, col: 1},  // diagonal
            {row: 1, col: -1}  // anti-diagonal
        ];
        
        let threatCount = 0;
        
        // Count threats in each direction
        for (const dir of directions) {
            if (this.detectThreat(row, col, dir, symbol)) {
                threatCount++;
            }
        }
        
        // Restore original value
        this.board[row][col] = originalValue;
        
        // Multiple threats = fork
        return threatCount >= 2;
    }
    
    /**
     * Detect if there is a serious threat in a direction
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {object} dir - Direction {row, col}
     * @param {string} symbol - Symbol to check
     * @returns {boolean} True if threat exists
     */
    detectThreat(row, col, dir, symbol) {
        // Check for patterns like open-threes that represent threats
        const consecutive = this.countConsecutive(row, col, dir, symbol);
        const openEnds = this.countOpenEnds(row, col, dir, symbol);
        
        // Consider it a threat if:
        // - 4 in a row with at least one open end
        // - 3 in a row with two open ends
        return (consecutive >= 4 && openEnds >= 1) || 
               (consecutive >= 3 && openEnds >= 2);
    }
    
    /**
     * Count consecutive pieces in a direction
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {object} dir - Direction {row, col}
     * @param {string} symbol - Symbol to check
     * @returns {number} Count of consecutive pieces
     */
    countConsecutive(row, col, dir, symbol) {
        let count = 1; // Start with the piece at (row, col)
        
        // Check forward
        for (let i = 1; i < 5; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;
            
            if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20 ||
                this.board[newRow][newCol] !== symbol) {
                break;
            }
            count++;
        }
        
        // Check backward
        for (let i = 1; i < 5; i++) {
            const newRow = row - dir.row * i;
            const newCol = col - dir.col * i;
            
            if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20 ||
                this.board[newRow][newCol] !== symbol) {
                break;
            }
            count++;
        }
        
        return count;
    }
    
    /**
     * Count open ends in a direction
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {object} dir - Direction {row, col}
     * @param {string} symbol - Symbol to check
     * @returns {number} Number of open ends (0-2)
     */
    countOpenEnds(row, col, dir, symbol) {
        let openEnds = 0;
        
        // Find the extent of the line
        let startRow = row;
        let startCol = col;
        let endRow = row;
        let endCol = col;
        
        // Find start of line
        for (let i = 1; i < 5; i++) {
            const newRow = row - dir.row * i;
            const newCol = col - dir.col * i;
            
            if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20 ||
                this.board[newRow][newCol] !== symbol) {
                break;
            }
            startRow = newRow;
            startCol = newCol;
        }
        
        // Find end of line
        for (let i = 1; i < 5; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;
            
            if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20 ||
                this.board[newRow][newCol] !== symbol) {
                break;
            }
            endRow = newRow;
            endCol = newCol;
        }
        
        // Check if start-1 is open
        const checkStartRow = startRow - dir.row;
        const checkStartCol = startCol - dir.col;
        if (checkStartRow >= 0 && checkStartRow < 20 && 
            checkStartCol >= 0 && checkStartCol < 20 &&
            this.board[checkStartRow][checkStartCol] === '') {
            openEnds++;
        }
        
        // Check if end+1 is open
        const checkEndRow = endRow + dir.row;
        const checkEndCol = endCol + dir.col;
        if (checkEndRow >= 0 && checkEndRow < 20 && 
            checkEndCol >= 0 && checkEndCol < 20 &&
            this.board[checkEndRow][checkEndCol] === '') {
            openEnds++;
        }
        
        return openEnds;
    }
    
    /**
     * Find strategic move using original simple approach
     * (Kept for compatibility but no longer used)
     */
    findStrategicMove() {
        // Initialize score board
        const scores = Array(20).fill().map(() => Array(20).fill(0));
        
        // Score all empty cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === '') {
                    scores[row][col] = this.scorePosition(row, col);
                }
            }
        }
        
        // Find cell with highest score
        let maxScore = -1;
        let bestMoves = [];
        
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === '') {
                    if (scores[row][col] > maxScore) {
                        maxScore = scores[row][col];
                        bestMoves = [{row, col}];
                    } else if (scores[row][col] === maxScore) {
                        bestMoves.push({row, col});
                    }
                }
            }
        }
        
        // If we found good moves, choose one at random
        if (bestMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * bestMoves.length);
            return bestMoves[randomIndex];
        }
        
        // Fallback to easy AI if no good move found
        return this.makeEasyAIMove();
    }
    
    /**
     * Original score position method (kept for compatibility)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number} Score
     */
    scorePosition(row, col) {
        let score = 0;
        
        // Directions: horizontal, vertical, diagonal, anti-diagonal
        const directions = [
            [{row: 0, col: 1}, {row: 0, col: -1}],  // horizontal
            [{row: 1, col: 0}, {row: -1, col: 0}],  // vertical
            [{row: 1, col: 1}, {row: -1, col: -1}], // diagonal
            [{row: 1, col: -1}, {row: -1, col: 1}]  // anti-diagonal
        ];
        
        // Check each direction
        for (const dirPair of directions) {
            score += this.scoreDirection(row, col, dirPair, this.aiSymbol) * 2; // Prioritize winning
            score += this.scoreDirection(row, col, dirPair, this.playerSymbol); // Block opponent
        }
        
        // Prefer center-ish positions
        const centerDistance = Math.sqrt(Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2));
        score += (10 - centerDistance) / 2;
        
        return score;
    }
    
    /**
     * Original score direction method (kept for compatibility)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {Array} dirPair - Pair of directions
     * @param {string} symbol - Symbol to score for
     * @returns {number} Score
     */
    scoreDirection(row, col, dirPair, symbol) {
        const counts = [0, 0]; // [consecutive, spaces]
        const maxCheck = this.winningLength - 1;
        
        // Check both directions
        for (let d = 0; d < 2; d++) {
            const dir = dirPair[d];
            
            // Look in this direction
            for (let i = 1; i <= maxCheck; i++) {
                const newRow = row + dir.row * i;
                const newCol = col + dir.col * i;
                
                // Check bounds
                if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20) {
                    break;
                }
                
                // Count consecutive symbols and spaces
                if (this.board[newRow][newCol] === symbol) {
                    counts[0]++;
                } else if (this.board[newRow][newCol] === '') {
                    counts[1]++;
                } else {
                    break; // Opponent's symbol, stop counting
                }
            }
        }
        
        // Score based on consecutive symbols and spaces
        if (counts[0] >= this.winningLength - 1) {
            return 100; // Can win
        } else if (counts[0] >= this.winningLength - 2 && counts[1] >= 1) {
            return 50;  // One move away from potential win
        } else if (counts[0] >= this.winningLength - 3 && counts[1] >= 2) {
            return 10;  // Two moves away from potential win
        }
        
        return counts[0] * 2 + counts[1];
    }
    
    /**
     * Check for win at the given position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {boolean} checkOnly - If true, don't update winningCells
     * @returns {boolean} True if win
     */
    checkWin(row, col, checkOnly = false) {
        const symbol = this.board[row][col];
        if (!symbol) return false;
        
        // Directions: horizontal, vertical, diagonal, anti-diagonal
        const directions = [
            {row: 0, col: 1},  // horizontal
            {row: 1, col: 0},  // vertical
            {row: 1, col: 1},  // diagonal
            {row: 1, col: -1}  // anti-diagonal
        ];
        
        for (const dir of directions) {
            let line = []; // Changed from const to let
            
            // Look in both directions
            for (let i = -this.winningLength + 1; i < this.winningLength; i++) {
                const newRow = row + dir.row * i;
                const newCol = col + dir.col * i;
                
                // Check bounds
                if (newRow >= 0 && newRow < 20 && newCol >= 0 && newCol < 20) {
                    if (this.board[newRow][newCol] === symbol) {
                        line.push({row: newRow, col: newCol});
                    } else {
                        line = [];
                    }
                    
                    // Check if we have enough consecutive symbols
                    if (line.length >= this.winningLength) {
                        if (!checkOnly) {
                            this.winningCells = line.slice(-this.winningLength);
                        }
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check for a draw
     * @returns {boolean} True if draw
     */
    checkDraw() {
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === '') {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Start the game timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            
            if (this.timeRemaining <= 0) {
                this.gameActive = false;
                this.stopTimer();
                return {
                    gameOver: true,
                    draw: true,
                    message: "Time's up! Game ended in a draw."
                };
            }
        }, 1000);
    }
    
    /**
     * Stop the game timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Reset the game
     */
    reset() {
        this.stopTimer();
        this.gameActive = false;
        this.winningCells = [];
    }
}

// Create a singleton instance
const game = new TicTacToeGame();