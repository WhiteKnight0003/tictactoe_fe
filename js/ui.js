/**
 * Tic Tac Toe UI Handler
 * Handles all UI interactions for the game
 */
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const setupPanel = document.getElementById('setup-panel');
    const setupForm = document.getElementById('setup-form');
    const gamePanel = document.getElementById('game-panel');
    const gameBoard = document.getElementById('game-board');
    const gameStatus = document.querySelector('.game-status');
    const currentPlayerDisplay = document.getElementById('current-player');
    const timerDisplay = document.getElementById('timer');
    const newGameBtn = document.getElementById('new-game-btn');
    const loadingModal = new bootstrap.Modal(document.getElementById('loading-modal'));
    
    // Game state variables
    let timerInterval;
    let warningThreshold = 60; // 1 minute warning
    
    /**
     * Initialize the game UI
     */
    function init() {
        // Set up event listeners
        setupForm.addEventListener('submit', startGame);
        newGameBtn.addEventListener('click', resetGame);
        
        // Create the game board
        createGameBoard();
    }
    
    /**
     * Create the game board in the DOM
     */
    function createGameBoard() {
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('role', 'button');
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `Cell at row ${row + 1}, column ${col + 1}`);
                
                // Add click event
                cell.addEventListener('click', () => handleCellClick(row, col));
                
                // Add keyboard support
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleCellClick(row, col);
                        e.preventDefault();
                    }
                });
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    /**
     * Start a new game
     * @param {Event} e - Form submit event
     */
    function startGame(e) {
        e.preventDefault();
        
        // Get player options
        const playerSymbol = document.querySelector('input[name="player-symbol"]:checked').value;
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        
        // Initialize game logic
        const gameState = game.init(playerSymbol, difficulty);
        
        // Show game panel, hide setup panel
        setupPanel.style.display = 'none';
        gamePanel.style.display = 'block';
        
        // Update UI
        updateBoard();
        updateGameStatus(null);
        currentPlayerDisplay.textContent = gameState.currentPlayer;
        
        // Start timer
        startTimer();
    }
    
    /**
     * Handle cell click
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    function handleCellClick(row, col) {
        // Check if it's the player's turn
        if (game.currentSymbol !== game.playerSymbol) {
            updateGameStatus({
                valid: false,
                message: "It's not your turn yet!"
            });
            return;
        }
        
        // Make the move
        const result = game.makeMove(row, col);
        
        // Update UI based on move result
        updateBoard();
        updateGameStatus(result);
        
        // Update current player display
        if (result.currentPlayer) {
            currentPlayerDisplay.textContent = result.currentPlayer;
        }
        
        // Handle AI move if needed
        if (result.valid && !result.gameOver && result.aiMove) {
            // Show loading modal
            loadingModal.show();
            
            setTimeout(() => {
                // Process AI move result
                updateBoard();
                updateGameStatus(result.aiMove);
                
                // Update current player display
                if (result.aiMove.currentPlayer) {
                    currentPlayerDisplay.textContent = result.aiMove.currentPlayer;
                }
                
                // Hide loading modal
                loadingModal.hide();
            }, 500);
        }
    }
    
    /**
     * Update the game board UI
     */
    function updateBoard() {
        const board = game.board;
        const cells = gameBoard.children;
        
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                const index = row * 20 + col;
                const cell = cells[index];
                const value = board[row][col];
                
                // Clear previous classes
                cell.classList.remove('x', 'o', 'winning-cell');
                
                // Add symbol if any
                if (value) {
                    cell.textContent = value;
                    cell.classList.add(value.toLowerCase());
                } else {
                    cell.textContent = '';
                }
                
                // Mark winning cells
                if (game.winningCells.some(pos => pos.row === row && pos.col === col)) {
                    cell.classList.add('winning-cell');
                }
            }
        }
    }
    
    /**
     * Update game status message
     * @param {Object} result - Game result
     */
    function updateGameStatus(result) {
        if (!result) {
            gameStatus.style.display = 'none';
            return;
        }
        
        // Show status
        gameStatus.style.display = 'block';
        gameStatus.textContent = result.message;
        
        // Remove previous classes
        gameStatus.classList.remove('alert-success', 'alert-danger', 'alert-info', 'alert-warning');
        
        // Add appropriate class
        if (result.gameOver && result.winner) {
            gameStatus.classList.add('alert-success');
        } else if (result.gameOver && result.draw) {
            gameStatus.classList.add('alert-info');
        } else if (!result.valid) {
            gameStatus.classList.add('alert-warning');
        } else {
            gameStatus.classList.add('alert-info');
        }
    }
    
    /**
     * Start the UI timer
     */
    function startTimer() {
        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Update timer display initially
        timerDisplay.textContent = game.formatTime(game.timeRemaining);
        timerDisplay.classList.remove('warning');
        
        // Set up timer interval
        timerInterval = setInterval(() => {
            timerDisplay.textContent = game.formatTime(game.timeRemaining);
            
            // Add warning class when time is running out
            if (game.timeRemaining <= warningThreshold) {
                timerDisplay.classList.add('warning');
            }
            
            // Check if game ended due to time
            if (game.timeRemaining <= 0) {
                updateGameStatus({
                    gameOver: true,
                    draw: true,
                    message: "Time's up! Game ended in a draw."
                });
                clearInterval(timerInterval);
            }
        }, 1000);
    }
    
    /**
     * Reset the game and return to setup
     */
    function resetGame() {
        // Reset game logic
        game.reset();
        
        // Clear the timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Switch back to setup panel
        gamePanel.style.display = 'none';
        setupPanel.style.display = 'block';
        
        // Reset game status
        updateGameStatus(null);
    }
    
    // Initialize the UI
    init();
});