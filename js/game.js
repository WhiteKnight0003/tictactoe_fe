/**
 * Tic Tac Toe Game Logic
 * 20x20 board with 5-in-a-row winning condition
 */
class TicTacToeGame {
    constructor() {
        this.board = Array(20)
            .fill()
            .map(() => Array(20).fill(""));
        this.currentSymbol = "X";
        this.playerSymbol = "X";
        this.aiSymbol = "O";
        this.gameActive = false;
        this.difficulty = "easy";
        this.winningLength = 5; // 5 in a row to win
        this.winningCells = [];
        this.timerDuration = 15 * 60; // 15 minutes in seconds
        // this.timerDuration = timerInSeconds;
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
    init(playerSymbol, difficulty, timerInSeconds = null) {
        // Reset the game state
        this.board = Array(20)
            .fill()
            .map(() => Array(20).fill(""));
        this.playerSymbol = playerSymbol;
        this.aiSymbol = playerSymbol === "X" ? "O" : "X";
        this.currentSymbol = "X"; // X always starts
        this.difficulty = difficulty;
        this.gameActive = true;
        this.winningCells = [];
    
        // Set timer duration from input if provided
        if (timerInSeconds !== null) {
            this.timerDuration = timerInSeconds;
        }
    
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
            timeRemaining: this.formatTime(this.timeRemaining),
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
        if (!this.gameActive || this.board[row][col] !== "") {
            return {
                valid: false,
                message: "Invalid move. Try again.",
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
                currentPlayer: this.currentSymbol,
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
                currentPlayer: this.currentSymbol,
            };
        }

        // Switch players
        this.currentSymbol = this.currentSymbol === "X" ? "O" : "X";

        // If it's the AI's turn
        const result = {
            valid: true,
            board: this.board,
            currentPlayer: this.currentSymbol,
            timeRemaining: this.formatTime(this.timeRemaining),
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
        if (this.difficulty === "easy") {
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
     * Make an AI move with "easy" difficulty - enhanced version (closer to hard)
     * Uses advanced strategy with controlled imperfection
     */
    makeEasyAIMove() {
        // 1. Check if AI can win in next move (100% of the time)
        const winMove = this.findWinningMove(this.aiSymbol);
        if (winMove) return winMove;

        // 2. Block player's winning move (95% of the time)
        if (Math.random() < 0.95) {
            const blockMove = this.findWinningMove(this.playerSymbol);
            if (blockMove) return blockMove;
        }

        // 3. Block player's fork/double threat (90% of the time)
        if (Math.random() < 0.9) {
            const blockForkMove = this.findAdvancedForkToBlock();
            if (blockForkMove) return blockForkMove;
        }

        // 4. Create own fork if possible (85% of the time)
        if (Math.random() < 0.85) {
            const createForkMove = this.findPotentialFork(this.aiSymbol);
            if (createForkMove) return createForkMove;
        }

        // 5. Take center region if available (early game preference)
        if (this.isBoardMostlyEmpty() && Math.random() < 0.9) {
            const centerMove = this.findGoodCenterMove();
            if (centerMove) return centerMove;
        }

        // 6. Strategic move based on advanced evaluation
        // 85% chance of making a very good move, 15% chance of making a suboptimal move
        if (Math.random() < 0.85) {
            const strategicMove = this.findAdvancedEasyStrategicMove();
            if (strategicMove) return strategicMove;
        }

        // 7. Make a decent move but not optimal
        const decentMove = this.findDecentMove();
        if (decentMove) return decentMove;

        // 8. Fallback to any empty cell
        return this.chooseRandomEmptyCell();
    }

    /**
     * Checks if the board is mostly empty (early game)
     */
    isBoardMostlyEmpty() {
        let filledCount = 0;
        let threshold = 8; // Early game threshold

        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] !== "") {
                    filledCount++;
                    if (filledCount > threshold) return false;
                }
            }
        }
        return true;
    }

    /**
     * Find a good move in the center region
     */
    findGoodCenterMove() {
        const centerMoves = [];
        // Define central region (slightly expanded)
        const centerStart = 6;
        const centerEnd = 13;

        // Look for empty cells in center region
        for (let row = centerStart; row <= centerEnd; row++) {
            for (let col = centerStart; col <= centerEnd; col++) {
                if (this.board[row][col] === "") {
                    // Score based on adjacency to existing pieces and center proximity
                    const score = this.evaluateCenterPosition(row, col);
                    centerMoves.push({ row, col, score });
                }
            }
        }

        if (centerMoves.length > 0) {
            // Sort by score
            centerMoves.sort((a, b) => b.score - a.score);
            // Take one of the top 3 moves
            const topIndex = Math.floor(
                Math.random() * Math.min(3, centerMoves.length)
            );
            return centerMoves[topIndex];
        }

        return null;
    }

    /**
     * Evaluate how good a center position is
     */
    evaluateCenterPosition(row, col) {
        let score = 0;

        // Proximity to absolute center (9.5, 9.5)
        const centerDistance = Math.sqrt(
            Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2)
        );
        score += Math.max(0, 8 - centerDistance) * 5;

        // Bonus for being adjacent to existing pieces
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const nr = row + dr;
                const nc = col + dc;

                if (nr >= 0 && nr < 20 && nc >= 0 && nc < 20) {
                    if (this.board[nr][nc] !== "") {
                        score += 10;
                        // Extra bonus if adjacent to own piece
                        if (this.board[nr][nc] === this.aiSymbol) {
                            score += 5;
                        }
                    }
                }
            }
        }

        // Add some randomness
        score += Math.random() * 15;

        return score;
    }

    /**
     * Find a potential fork move (creates two threats)
     */
    findPotentialFork(symbol) {
        const potentialForks = [];

        // Check all empty cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === "") {
                    // Temporarily place the symbol
                    this.board[row][col] = symbol;

                    // Check if this creates a fork
                    if (this.detectAdvancedFork(row, col, symbol)) {
                        potentialForks.push({ row, col });
                    }

                    // Undo the move
                    this.board[row][col] = "";
                }
            }
        }

        if (potentialForks.length > 0) {
            // Choose a random fork move
            return potentialForks[
                Math.floor(Math.random() * potentialForks.length)
            ];
        }

        return null;
    }

    /**
     * Advanced fork detection (multiple threats)
     */
    detectAdvancedFork(row, col, symbol) {
        const directions = [
            { row: 0, col: 1 }, // horizontal
            { row: 1, col: 0 }, // vertical
            { row: 1, col: 1 }, // diagonal
            { row: 1, col: -1 }, // anti-diagonal
        ];

        let threatCount = 0;

        // Count threats in each direction
        for (const dir of directions) {
            if (this.detectThreatInDirection(row, col, dir, symbol)) {
                threatCount++;
                if (threatCount >= 2) return true;
            }
        }

        return false;
    }

    /**
     * Detect a threat in a specific direction
     */
    detectThreatInDirection(row, col, dir, symbol) {
        // Get line of 9 cells centered on (row, col) in this direction
        const line = [];

        for (let i = -4; i <= 4; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;

            if (newRow >= 0 && newRow < 20 && newCol >= 0 && newCol < 20) {
                line.push(
                    this.board[newRow][newCol] === symbol
                        ? symbol
                        : this.board[newRow][newCol] === ""
                        ? "."
                        : "X"
                );
            }
        }

        // Convert line to string for pattern matching
        const lineStr = line.join("");

        // Check for patterns that constitute threats
        // "." = empty, symbol = own symbol, anything else = blocked
        const threatPatterns = [
            `.${symbol}${symbol}${symbol}.`, // Open four
            `.${symbol}${symbol}.${symbol}.`, // Split four type 1
            `.${symbol}.${symbol}${symbol}.`, // Split four type 2
            `..${symbol}${symbol}${symbol}`, // Edge four type 1
            `${symbol}${symbol}${symbol}..`, // Edge four type 2
            `.${symbol}${symbol}..`, // Strong three
            `..${symbol}${symbol}.`, // Strong three
        ];

        // Check if any threat pattern exists in the line
        for (const pattern of threatPatterns) {
            if (lineStr.includes(pattern)) return true;
        }

        return false;
    }

    /**
     * Find an advanced fork to block (more comprehensive than basic version)
     */
    findAdvancedForkToBlock() {
        const potentialThreats = [];

        // Check all empty cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === "") {
                    // Temporarily place the player's symbol
                    this.board[row][col] = this.playerSymbol;

                    // Check if this creates a fork and calculate threat level
                    const threatLevel = this.evaluateThreatLevel(
                        row,
                        col,
                        this.playerSymbol
                    );

                    // Undo the move
                    this.board[row][col] = "";

                    if (threatLevel >= 2) {
                        potentialThreats.push({ row, col, threatLevel });
                    }
                }
            }
        }

        // If there are threats, block the most serious one
        if (potentialThreats.length > 0) {
            // Sort by threat level (highest first)
            potentialThreats.sort((a, b) => b.threatLevel - a.threatLevel);
            return potentialThreats[0];
        }

        return null;
    }

    /**
     * Evaluate the threat level at a position
     */
    evaluateThreatLevel(row, col, symbol) {
        const directions = [
            { row: 0, col: 1 }, // horizontal
            { row: 1, col: 0 }, // vertical
            { row: 1, col: 1 }, // diagonal
            { row: 1, col: -1 }, // anti-diagonal
        ];

        let threatCount = 0;
        let maxThreatValue = 0;

        // Check each direction
        for (const dir of directions) {
            const threatValue = this.evaluateDirectionalThreat(
                row,
                col,
                dir,
                symbol
            );

            if (threatValue >= 90) {
                threatCount += 2; // Critical threat (almost winning)
                maxThreatValue = Math.max(maxThreatValue, threatValue);
            } else if (threatValue >= 50) {
                threatCount++; // Significant threat
                maxThreatValue = Math.max(maxThreatValue, threatValue);
            }
        }

        // Return combined threat assessment
        return threatCount + maxThreatValue / 100;
    }

    /**
     * Evaluate threat in a specific direction
     */
    evaluateDirectionalThreat(row, col, dir, symbol) {
        // Count consecutive pieces and open ends
        let consecutive = 1; // Start with the current position
        let openEnds = 0;
        let gaps = 0;

        // Check forward
        let forwardConsecutive = 0;
        let forwardOpen = false;
        let forwardGap = false;

        for (let i = 1; i <= 5; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;

            if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20) break;

            if (this.board[newRow][newCol] === symbol) {
                if (forwardGap) {
                    gaps++;
                    forwardConsecutive = 1;
                    forwardGap = false;
                } else {
                    forwardConsecutive++;
                }
            } else if (this.board[newRow][newCol] === "") {
                if (forwardConsecutive === 0) {
                    forwardOpen = true;
                    break;
                } else {
                    forwardGap = true;
                }
            } else {
                // Opponent's piece - blocked
                break;
            }
        }

        consecutive += forwardConsecutive;
        if (forwardOpen) openEnds++;

        // Check backward
        let backwardConsecutive = 0;
        let backwardOpen = false;
        let backwardGap = false;

        for (let i = 1; i <= 5; i++) {
            const newRow = row - dir.row * i;
            const newCol = col - dir.col * i;

            if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20) break;

            if (this.board[newRow][newCol] === symbol) {
                if (backwardGap) {
                    gaps++;
                    backwardConsecutive = 1;
                    backwardGap = false;
                } else {
                    backwardConsecutive++;
                }
            } else if (this.board[newRow][newCol] === "") {
                if (backwardConsecutive === 0) {
                    backwardOpen = true;
                    break;
                } else {
                    backwardGap = true;
                }
            } else {
                // Opponent's piece - blocked
                break;
            }
        }

        consecutive += backwardConsecutive;
        if (backwardOpen) openEnds++;

        // Calculate threat level
        let threatValue = 0;

        if (consecutive >= 4) {
            // One move away from winning
            threatValue = 100;
        } else if (consecutive === 3) {
            // Three in a row
            if (openEnds === 2 && gaps === 0) {
                // Open three (very dangerous)
                threatValue = 90;
            } else if (openEnds === 1 && gaps === 0) {
                // Semi-open three
                threatValue = 60;
            } else if (openEnds === 2 && gaps === 1) {
                // Split three with two open ends
                threatValue = 70;
            }
        } else if (consecutive === 2) {
            // Two in a row
            if (openEnds === 2 && gaps === 0) {
                // Open two with potential
                threatValue = 40;
            } else if (openEnds === 1 && gaps === 0) {
                // Semi-open two
                threatValue = 20;
            }
        }

        return threatValue;
    }

    /**
     * Find an advanced strategic move for "easy" mode (more sophisticated)
     */
    findAdvancedEasyStrategicMove() {
        // Get candidate moves (empty cells near existing pieces)
        const candidateMoves = this.findExpandedCandidateMoves();
        if (candidateMoves.length === 0) return this.chooseRandomEmptyCell();

        // Score each candidate move
        const scoredMoves = candidateMoves.map((move) => ({
            ...move,
            score: this.getAdvancedEasyScore(move.row, move.col),
        }));

        // Sort by score (highest first)
        scoredMoves.sort((a, b) => b.score - a.score);

        // Choose one of the top moves
        // Pick from top 20% of moves to ensure better play but still not perfect
        const topCount = Math.max(1, Math.floor(scoredMoves.length * 0.2));
        const randomTopIndex = Math.floor(Math.random() * topCount);

        return scoredMoves[randomTopIndex];
    }

    /**
     * Find candidate moves with expanded search area
     */
    findExpandedCandidateMoves() {
        const candidates = new Set();
        // Consider cells within 3 spaces of existing moves (up from 2)
        const proximity = 3;

        // First pass: find cells near existing pieces
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] !== "") {
                    // Add empty neighbors to candidates
                    for (let dr = -proximity; dr <= proximity; dr++) {
                        for (let dc = -proximity; dc <= proximity; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;

                            // Check bounds and that cell is empty
                            if (
                                newRow >= 0 &&
                                newRow < 20 &&
                                newCol >= 0 &&
                                newCol < 20 &&
                                this.board[newRow][newCol] === ""
                            ) {
                                candidates.add(`${newRow},${newCol}`);
                            }
                        }
                    }
                }
            }
        }

        // Second pass: if board is sparse, add some center region cells
        if (candidates.size < 10) {
            for (let row = 7; row <= 12; row++) {
                for (let col = 7; col <= 12; col++) {
                    if (this.board[row][col] === "") {
                        candidates.add(`${row},${col}`);
                    }
                }
            }
        }

        // Convert back to array of objects
        const result = [];
        candidates.forEach((coord) => {
            const [row, col] = coord.split(",").map(Number);
            result.push({ row, col });
        });

        return result;
    }

    /**
     * Get an advanced score for a position (close to hard difficulty)
     */
    getAdvancedEasyScore(row, col) {
        let score = 0;

        // Directions: horizontal, vertical, diagonal, anti-diagonal
        const directions = [
            [
                { row: 0, col: 1 },
                { row: 0, col: -1 },
            ], // horizontal
            [
                { row: 1, col: 0 },
                { row: -1, col: 0 },
            ], // vertical
            [
                { row: 1, col: 1 },
                { row: -1, col: -1 },
            ], // diagonal
            [
                { row: 1, col: -1 },
                { row: -1, col: 1 },
            ], // anti-diagonal
        ];

        // Check for potential in each direction with advanced scoring
        for (const dirPair of directions) {
            // Check AI's potential (offense) - 90% of hard AI weight
            const aiScore = this.scoreAdvancedDirection(
                row,
                col,
                dirPair,
                this.aiSymbol
            );
            score += aiScore * 1.8; // Slightly less aggressive than hard AI

            // Check player's potential (defense) - Higher weight for defense
            const playerScore = this.scoreAdvancedDirection(
                row,
                col,
                dirPair,
                this.playerSymbol
            );
            score += playerScore * 2.0; // More defensive

            // Prioritize blocking high-threat patterns
            if (playerScore >= 90) score += 150; // Critical defensive move
            else if (playerScore >= 70) score += 100; // Important defensive move

            // Look for attacking opportunities but with less weight than hard AI
            if (aiScore >= 90) score += 120; // Strong attack
            else if (aiScore >= 70) score += 80; // Good attack
        }

        // Bonus for center-ish positions, slightly less than hard AI
        const centerDistance = Math.sqrt(
            Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2)
        );
        score += Math.max(0, 10 - centerDistance) * 5;

        // Check if position extends existing lines
        score += this.evaluatePositionContext(row, col) * 0.9; // 90% of what hard AI would value

        // Add some randomness to make play less predictable
        score += Math.random() * 25; // More randomness than hard, less than pure random

        return score;
    }

    /**
     * Advanced scoring for a direction
     */
    scoreAdvancedDirection(row, col, dirPair, symbol) {
        let score = 0;
        let maxConsecutive = 0;
        let openEnds = 0;
        let gaps = 0;

        // Place the symbol temporarily
        const originalValue = this.board[row][col];
        this.board[row][col] = symbol;

        // Analyze the line in both directions
        const consecutiveCounts = [1]; // Start with 1 for the current position
        let currentRun = 1;
        let totalLength = 1;

        // Check the line in both directions
        for (const dir of dirPair) {
            let hasOpenEnd = false;

            // Look up to 5 spaces in this direction
            for (let i = 1; i <= 5; i++) {
                const newRow = row + dir.row * i;
                const newCol = col + dir.col * i;

                // Check bounds
                if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20)
                    break;

                if (this.board[newRow][newCol] === symbol) {
                    currentRun++;
                    totalLength++;
                } else if (this.board[newRow][newCol] === "") {
                    hasOpenEnd = true;
                    // If we see an empty space, start a new run
                    if (currentRun > 1) {
                        consecutiveCounts.push(currentRun);
                        currentRun = 1;
                        gaps++;
                    }
                    break;
                } else {
                    // Opponent's piece blocks this direction
                    break;
                }
            }

            if (hasOpenEnd) openEnds++;

            // Reset for next direction
            if (currentRun > 1) {
                consecutiveCounts.push(currentRun);
            }
            currentRun = 1;
        }

        // Find the max consecutive pieces
        maxConsecutive = Math.max(...consecutiveCounts);

        // Restore the original value
        this.board[row][col] = originalValue;

        // Calculate score based on pattern analysis
        if (maxConsecutive >= 5) {
            // Winning move
            score = 1000;
        } else if (totalLength >= 5) {
            // Potential winning configuration (possibly with gaps)
            score = 500;
        } else if (maxConsecutive === 4) {
            // Four in a row
            if (openEnds === 2) {
                // Open-four (extremely dangerous)
                score = 300;
            } else if (openEnds === 1) {
                // Semi-open four (still dangerous)
                score = 100;
            }
        } else if (maxConsecutive === 3) {
            // Three in a row
            if (openEnds === 2 && gaps === 0) {
                // Open-three (strong threat)
                score = 90;
            } else if (openEnds === 1 && gaps === 0) {
                // Semi-open three (moderate threat)
                score = 50;
            } else if (openEnds === 2 && gaps === 1) {
                // Split three with two open ends (potential)
                score = 70;
            }
        } else if (maxConsecutive === 2) {
            // Two in a row
            if (openEnds === 2 && gaps === 0) {
                // Open-two (potential development)
                score = 30;
            } else if (openEnds === 1 && gaps === 0) {
                // Semi-open two (minor potential)
                score = 15;
            }
        } else {
            // Single piece
            score = openEnds * 5;
        }

        // Penalty for no open ends
        if (openEnds === 0) score /= 3;

        return score;
    }

    /**
     * Evaluate the context of a position (how it fits with existing pieces)
     */
    evaluatePositionContext(row, col) {
        let contextScore = 0;
        const ownPieces = [];
        const opponentPieces = [];

        // Check 5x5 area around the position
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue; // Skip the position itself

                const nr = row + dr;
                const nc = col + dc;

                if (nr >= 0 && nr < 20 && nc >= 0 && nc < 20) {
                    if (this.board[nr][nc] === this.aiSymbol) {
                        // Calculate Manhattan distance
                        const distance = Math.abs(dr) + Math.abs(dc);
                        ownPieces.push({ row: nr, col: nc, distance });
                    } else if (this.board[nr][nc] === this.playerSymbol) {
                        const distance = Math.abs(dr) + Math.abs(dc);
                        opponentPieces.push({ row: nr, col: nc, distance });
                    }
                }
            }
        }

        // Bonus for being near own pieces in a line formation
        if (ownPieces.length >= 2) {
            // Check if this position extends a line
            contextScore +=
                this.checkLineFormation(row, col, ownPieces, this.aiSymbol) *
                20;
        }

        // Bonus for blocking opponent's line formation
        if (opponentPieces.length >= 2) {
            contextScore +=
                this.checkLineFormation(
                    row,
                    col,
                    opponentPieces,
                    this.playerSymbol
                ) * 25;
        }

        // Bonus for positions that bridge own pieces
        if (ownPieces.length >= 2) {
            const closeOwnPieces = ownPieces.filter((p) => p.distance <= 2);
            if (closeOwnPieces.length >= 2) {
                contextScore += 15;
            }
        }

        return contextScore;
    }

    /**
     * Check if a position extends or creates a line formation
     */
    checkLineFormation(row, col, pieces, symbol) {
        // Directions to check
        const directions = [
            { row: 0, col: 1 }, // horizontal
            { row: 1, col: 0 }, // vertical
            { row: 1, col: 1 }, // diagonal
            { row: 1, col: -1 }, // anti-diagonal
        ];

        let maxLineScore = 0;

        for (const dir of directions) {
            let lineScore = 0;
            let inLine = 0;

            // Check pieces in this direction
            for (const piece of pieces) {
                // Check if piece is in line with current position and direction
                if (this.isInLine(row, col, piece.row, piece.col, dir)) {
                    inLine++;
                    lineScore += 10;

                    // Extra bonus for close pieces
                    if (piece.distance === 1) lineScore += 10;
                    else if (piece.distance === 2) lineScore += 5;
                }
            }

            // Extra bonus for more pieces in line
            if (inLine >= 2) lineScore += 20;

            maxLineScore = Math.max(maxLineScore, lineScore);
        }

        return maxLineScore;
    }

    /**
     * Check if two points are in a line with the given direction
     */
    isInLine(row1, col1, row2, col2, dir) {
        // Check if the vector between the points is parallel to the direction
        const rowDiff = row2 - row1;
        const colDiff = col2 - col1;

        // For horizontal direction
        if (dir.row === 0 && dir.col === 1) {
            return rowDiff === 0; // Same row
        }

        // For vertical direction
        if (dir.row === 1 && dir.col === 0) {
            return colDiff === 0; // Same column
        }

        // For diagonal direction
        if (dir.row === 1 && dir.col === 1) {
            return rowDiff === colDiff; // row difference equals column difference
        }

        // For anti-diagonal direction
        if (dir.row === 1 && dir.col === -1) {
            return rowDiff === -colDiff; // row difference equals negative column difference
        }

        return false;
    }

    /**
     * Find a decent but not optimal move
     * This ensures AI doesn't always play perfectly
     */
    findDecentMove() {
        const candidateMoves = this.findCandidateMoves();
        if (candidateMoves.length === 0) return this.chooseRandomEmptyCell();

        // Score moves with a simplified evaluation
        const scoredMoves = candidateMoves.map((move) => ({
            ...move,
            score:
                this.getSimplifiedScore(move.row, move.col) +
                Math.random() * 50,
        }));

        // Sort by score
        scoredMoves.sort((a, b) => b.score - a.score);

        // Choose from the middle range of moves (not best, not worst)
        const startIndex = Math.floor(scoredMoves.length * 0.3); // Skip top 30%
        const endIndex = Math.floor(scoredMoves.length * 0.7); // Don't go into bottom 30%

        if (startIndex < endIndex) {
            const selectedIndex =
                startIndex +
                Math.floor(Math.random() * (endIndex - startIndex));
            return scoredMoves[selectedIndex];
        }

        // If too few moves, just pick a random one
        return scoredMoves[Math.floor(Math.random() * scoredMoves.length)];
    }

    /**
     * Simplified scoring function for decent moves
     */
    getSimplifiedScore(row, col) {
        let score = 0;

        // Directions: horizontal, vertical, diagonal, anti-diagonal
        const directions = [
            [
                { row: 0, col: 1 },
                { row: 0, col: -1 },
            ], // horizontal
            [
                { row: 1, col: 0 },
                { row: -1, col: 0 },
            ], // vertical
            [
                { row: 1, col: 1 },
                { row: -1, col: -1 },
            ], // diagonal
            [
                { row: 1, col: -1 },
                { row: -1, col: 1 },
            ], // anti-diagonal
        ];

        // Check for basic patterns in each direction
        for (const dirPair of directions) {
            score += this.scoreBasicDirection(row, col, dirPair, this.aiSymbol);
            score +=
                this.scoreBasicDirection(row, col, dirPair, this.playerSymbol) *
                1.2;
        }

        // Basic center preference
        const centerDistance = Math.sqrt(
            Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2)
        );
        score += Math.max(0, 8 - centerDistance) * 3;

        return score;
    }

    /**
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
                if (this.board[row][col] === "") {
                    // Temporarily place the symbol
                    this.board[row][col] = symbol;

                    // Check if this creates a win
                    const isWinning = this.checkWin(row, col, true);

                    // Undo the move
                    this.board[row][col] = "";

                    if (isWinning) {
                        return { row, col };
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
        const scores = Array(20)
            .fill()
            .map(() => Array(20).fill(0));

        // Find cells worth considering (near existing moves)
        const candidateMoves = this.findCandidateMoves();

        // If first few moves of the game and no candidates, prefer center region
        if (candidateMoves.length === 0) {
            const centerRow = Math.floor(Math.random() * 6) + 7; // 7-12
            const centerCol = Math.floor(Math.random() * 6) + 7; // 7-12
            return { row: centerRow, col: centerCol };
        }

        // Score candidate positions
        for (const { row, col } of candidateMoves) {
            scores[row][col] = this.enhancedScorePosition(row, col);
        }

        // Find cell with highest score
        let maxScore = -Infinity;
        let bestMoves = [];

        for (const { row, col } of candidateMoves) {
            if (scores[row][col] > maxScore) {
                maxScore = scores[row][col];
                bestMoves = [{ row, col }];
            } else if (scores[row][col] === maxScore) {
                bestMoves.push({ row, col });
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
                if (this.board[row][col] !== "") {
                    // Add empty neighbors to candidates
                    for (let dr = -proximity; dr <= proximity; dr++) {
                        for (let dc = -proximity; dc <= proximity; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;

                            // Check bounds and that cell is empty
                            if (
                                newRow >= 0 &&
                                newRow < 20 &&
                                newCol >= 0 &&
                                newCol < 20 &&
                                this.board[newRow][newCol] === ""
                            ) {
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
        candidates.forEach((coord) => {
            const [row, col] = coord.split(",").map(Number);
            result.push({ row, col });
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
            [
                { row: 0, col: 1 },
                { row: 0, col: -1 },
            ], // horizontal
            [
                { row: 1, col: 0 },
                { row: -1, col: 0 },
            ], // vertical
            [
                { row: 1, col: 1 },
                { row: -1, col: -1 },
            ], // diagonal
            [
                { row: 1, col: -1 },
                { row: -1, col: 1 },
            ], // anti-diagonal
        ];

        // Check each direction for patterns
        for (const dirPair of directions) {
            // Evaluate AI's potential in this direction
            const aiPatterns = this.evaluateDirectionalPatterns(
                row,
                col,
                dirPair,
                this.aiSymbol
            );
            aiScore += aiPatterns.score;

            // Evaluate player's potential in this direction
            const playerPatterns = this.evaluateDirectionalPatterns(
                row,
                col,
                dirPair,
                this.playerSymbol
            );
            playerScore += playerPatterns.score;

            // Special case: if player is one move away from winning, block is critical
            if (playerPatterns.threatLevel >= 4) {
                playerScore += 1000;
            }

            // Special case: if AI can create a fork (multiple winning threats)
            if (
                aiPatterns.threatLevel >= 3 &&
                this.detectFork(row, col, this.aiSymbol)
            ) {
                aiScore += 800;
            }
        }

        // Balance offense and defense with slight preference for offense
        const finalScore = aiScore * 1.2 + playerScore;

        // Add a small preference for center-ish positions
        const centerDistance = Math.sqrt(
            Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2)
        );
        const centerBonus = Math.max(0, 10 - centerDistance) / 2;

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
        line.push({ row, col }); // Add current position

        // Look forward and backward
        for (const dir of dirPair) {
            for (let i = 1; i < 6; i++) {
                // Look up to 5 spaces in each direction
                const newRow = row + dir.row * i;
                const newCol = col + dir.col * i;

                // Check bounds
                if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 20) {
                    break;
                }

                // Check cell content
                if (this.board[newRow][newCol] === symbol) {
                    line.push({ row: newRow, col: newCol });
                } else if (this.board[newRow][newCol] === "") {
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
            { row: 0, col: 1 }, // horizontal
            { row: 1, col: 0 }, // vertical
            { row: 1, col: 1 }, // diagonal
            { row: 1, col: -1 }, // anti-diagonal
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
        return (
            (consecutive >= 4 && openEnds >= 1) ||
            (consecutive >= 3 && openEnds >= 2)
        );
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

            if (
                newRow < 0 ||
                newRow >= 20 ||
                newCol < 0 ||
                newCol >= 20 ||
                this.board[newRow][newCol] !== symbol
            ) {
                break;
            }
            count++;
        }

        // Check backward
        for (let i = 1; i < 5; i++) {
            const newRow = row - dir.row * i;
            const newCol = col - dir.col * i;

            if (
                newRow < 0 ||
                newRow >= 20 ||
                newCol < 0 ||
                newCol >= 20 ||
                this.board[newRow][newCol] !== symbol
            ) {
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

            if (
                newRow < 0 ||
                newRow >= 20 ||
                newCol < 0 ||
                newCol >= 20 ||
                this.board[newRow][newCol] !== symbol
            ) {
                break;
            }
            startRow = newRow;
            startCol = newCol;
        }

        // Find end of line
        for (let i = 1; i < 5; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;

            if (
                newRow < 0 ||
                newRow >= 20 ||
                newCol < 0 ||
                newCol >= 20 ||
                this.board[newRow][newCol] !== symbol
            ) {
                break;
            }
            endRow = newRow;
            endCol = newCol;
        }

        // Check if start-1 is open
        const checkStartRow = startRow - dir.row;
        const checkStartCol = startCol - dir.col;
        if (
            checkStartRow >= 0 &&
            checkStartRow < 20 &&
            checkStartCol >= 0 &&
            checkStartCol < 20 &&
            this.board[checkStartRow][checkStartCol] === ""
        ) {
            openEnds++;
        }

        // Check if end+1 is open
        const checkEndRow = endRow + dir.row;
        const checkEndCol = endCol + dir.col;
        if (
            checkEndRow >= 0 &&
            checkEndRow < 20 &&
            checkEndCol >= 0 &&
            checkEndCol < 20 &&
            this.board[checkEndRow][checkEndCol] === ""
        ) {
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
        const scores = Array(20)
            .fill()
            .map(() => Array(20).fill(0));

        // Score all empty cells
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === "") {
                    scores[row][col] = this.scorePosition(row, col);
                }
            }
        }

        // Find cell with highest score
        let maxScore = -1;
        let bestMoves = [];

        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.board[row][col] === "") {
                    if (scores[row][col] > maxScore) {
                        maxScore = scores[row][col];
                        bestMoves = [{ row, col }];
                    } else if (scores[row][col] === maxScore) {
                        bestMoves.push({ row, col });
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
            [
                { row: 0, col: 1 },
                { row: 0, col: -1 },
            ], // horizontal
            [
                { row: 1, col: 0 },
                { row: -1, col: 0 },
            ], // vertical
            [
                { row: 1, col: 1 },
                { row: -1, col: -1 },
            ], // diagonal
            [
                { row: 1, col: -1 },
                { row: -1, col: 1 },
            ], // anti-diagonal
        ];

        // Check each direction
        for (const dirPair of directions) {
            score += this.scoreDirection(row, col, dirPair, this.aiSymbol) * 2; // Prioritize winning
            score += this.scoreDirection(row, col, dirPair, this.playerSymbol); // Block opponent
        }

        // Prefer center-ish positions
        const centerDistance = Math.sqrt(
            Math.pow(row - 9.5, 2) + Math.pow(col - 9.5, 2)
        );
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
                } else if (this.board[newRow][newCol] === "") {
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
            return 50; // One move away from potential win
        } else if (counts[0] >= this.winningLength - 3 && counts[1] >= 2) {
            return 10; // Two moves away from potential win
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
            { row: 0, col: 1 }, // horizontal
            { row: 1, col: 0 }, // vertical
            { row: 1, col: 1 }, // diagonal
            { row: 1, col: -1 }, // anti-diagonal
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
                        line.push({ row: newRow, col: newCol });
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
                if (this.board[row][col] === "") {
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
                    message: "Time's up! Game ended in a draw.",
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
        return `${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
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
