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
    const headlines = document.getElementById('head');

    //Them
    const timerInputDisplay = document.getElementById('timer-display');
    const symbolX = document.getElementById('symbol-x');
    const symbolO = document.getElementById('symbol-o');
    const difficultyEasy = document.getElementById('difficulty-easy');
    const timerButton = document.getElementById('timer-button');

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
        
        // Thêm style cho hiệu ứng đánh dấu nước đi của AI
        addAIHighlightStyle();

        //Them
        setupTimerEvents();
    }
    //Them
    function setupTimerEvents() {
        // Mặc định hiển thị 15:00 cho timer
        if (!timerInputDisplay.textContent || timerInputDisplay.textContent.trim() === '') {
            timerInputDisplay.textContent = '00:03:00';
        }
        
        // Xử lý nút Timer (bật/tắt chức năng đếm thời gian)
        timerButton.addEventListener('click', function() {
            if (timerInputDisplay.classList.contains('disabled')) {
                // Bật timer
                timerInputDisplay.classList.remove('disabled');
                timerInputDisplay.contentEditable = true;
                this.classList.remove('btn-secondary');
                this.classList.add('btn-outline-primary');
            } else {
                // Tắt timer
                timerInputDisplay.classList.add('disabled');
                timerInputDisplay.contentEditable = false;
                timerInputDisplay.textContent = '00:03:00'; // Reset về 15 phút
                this.classList.remove('btn-outline-primary');
                this.classList.add('btn-secondary');
            }
        });
        
        // Validation cho trường nhập thời gian
        timerInputDisplay.addEventListener('blur', function() {
            const inputValue = this.textContent.trim();
            const timePattern = /^(\d{2}):(\d{2}):(\d{2})$/;
            
            if (!timePattern.test(inputValue)) {
                // Reset về giá trị mặc định nếu định dạng không hợp lệ
                this.textContent = '00:03:00';
                return;
            }
            
            // Kiểm tra giá trị hợp lệ cho giờ, phút, giây
            const [hours, minutes, seconds] = inputValue.split(':').map(Number);
            
            if (hours > 23 || minutes > 59 || seconds > 59) {
                this.textContent = '00:03:00';
            }
        });
    }
    function timeStringToSeconds(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    /**
     * Thêm CSS cho hiệu ứng đánh dấu nước đi của AI
     */
    function addAIHighlightStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-last-move {
                animation: highlight 2s ease-out;
            }
            
            @keyframes highlight {
                0% {
                    background-color: rgba(255, 217, 102, 0.8);
                    box-shadow: 0 0 15px rgba(255, 217, 102, 0.8);
                }
                100% {
                    background-color: transparent;
                    box-shadow: none;
                }
            }
        `;
        document.head.appendChild(style);
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
                cell.id = `cell-${row}-${col}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('role', 'button');
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `Cell at row ${row + 1}, column ${col + 1}`);
                
                // Add click event
                cell.addEventListener('click', () => handleCellClick(row, col));
                
                // Add keyboard support - fixed line 50
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
        // const gameState = game.init(playerSymbol, difficulty);
        //Them
        const timeInSeconds = timeStringToSeconds(timerInputDisplay.textContent.trim());
        const gameState = game.init(playerSymbol, difficulty, timeInSeconds);
        
        // Show game panel, hide setup panel
        setupPanel.style.display = 'none';
        gamePanel.style.display = 'block';
        headlines.style.display = 'none';
        
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
        
        // Handle AI move if needed - fixed line 108
        if (result.valid && !result.gameOver && result.aiMove) {
            // Show loading modal
            loadingModal.show();
            
            setTimeout(() => {
                // Make AI move
                const aiMoveResult = game.makeAiMove();
                
                // Lưu nước đi mới nhất của AI
                if (aiMoveResult && aiMoveResult.valid) {
                    // Tìm vị trí nước đi của AI
                    for (let r = 0; r < 20; r++) {
                        for (let c = 0; c < 20; c++) {
                            // Nếu ô này không trống trong kết quả mới nhưng trống trong result
                            if (aiMoveResult.board[r][c] !== '' && (result.board[r][c] === '')) {
                                // Lưu vị trí nước đi mới nhất của AI
                                game.lastAiMove = {row: r, col: c};
                                break;
                            }
                        }
                    }
                }
                
                // Process AI move result
                if (aiMoveResult) {
                    updateBoard();
                    updateGameStatus(aiMoveResult);
                    
                    // Update current player display
                    if (aiMoveResult.currentPlayer) {
                        currentPlayerDisplay.textContent = aiMoveResult.currentPlayer;
                    }
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
        
        // Xóa tất cả các class ai-last-move hiện tại
        document.querySelectorAll('.ai-last-move').forEach(cell => {
            cell.classList.remove('ai-last-move');
        });
        
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
                
                // Đánh dấu nước đi mới nhất của AI
                if (game.lastAiMove && game.lastAiMove.row === row && game.lastAiMove.col === col) {
                    cell.classList.add('ai-last-move');
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
        
        // Reset last AI move tracking
        game.lastAiMove = null;
        
        // Clear the timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        const setupCol = document.querySelector('#setup-panel .col-md-6');
        setTimeout(() => {
            setupPanel.style.position = 'static';
            setupPanel.style.left = 'auto';
            setupPanel.style.transform = 'none';
        }, 0);
        // Switch back to setup panel
        gamePanel.style.display = 'none';
        setupPanel.style.display = 'block';
        headlines.style.display = 'block';
        
        
        // Reset game status
        updateGameStatus(null);
    }
    
    // Initialize the UI
    init();
});
