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
    const rulesPanel = createRulesPanel();
    document.querySelector('.container.py-4').appendChild(rulesPanel);
    const gameImages = {
        win: 'Pics/win.png',  // Thay đổi đường dẫn tùy vào vị trí ảnh của bạn
        lose: 'Pics/lose.png',
        draw: 'Pics/draw.png'
    };

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
        createResultModal();
        addRulesButton();
       
    }
    function createRulesPanel() {
        const rulesPanel = document.createElement('div');
        rulesPanel.id = 'rules-panel';
        rulesPanel.style.display = 'none';
        
        rulesPanel.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h2 class="h5 mb-0">Game Rules</h2>
                        <button class="btn btn-sm btn-light" id="exit-rules-btn">Exit</button>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">The game is played on a 20x20 board.</li>
                            <li class="list-group-item">Players alternate turns, placing one mark at a time.</li>
                            <li class="list-group-item">Get 5 of your symbols in a row (horizontally, vertically, or diagonally) to win.</li>
                            <li class="list-group-item">The game ends in a draw if time runs out or if the board is completely filled.</li>         
                            <li class="list-group-item">The AI adapts to your skill: from casual random moves to calculated strategies.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Thêm sự kiện cho nút exit ngay sau khi tạo panel
        setTimeout(() => {
            const exitBtn = document.getElementById('exit-rules-btn');
            if (exitBtn) {
                exitBtn.addEventListener('click', exitRules);
            }
        }, 0);
        
        return rulesPanel;
    }
    
    function addRulesButton() {
        // Tạo nút Hướng dẫn chơi
        const rulesButton = document.createElement('button');
        rulesButton.type = 'button';
        rulesButton.className = 'btn btn-info mt-3 w-100'; // Thêm w-100 để nút có chiều rộng 100%
        rulesButton.textContent = 'HOW TO PLAY ?';
        rulesButton.id = 'show-rules-btn';
        // Thêm style trực tiếp để nút có kích thước tương tự nút PLAY NOW
        rulesButton.style.display = 'block';
        rulesButton.style.margin = '10px auto'; // Căn giữa nút
        rulesButton.style.width = 'auto'; // Chiều rộng tự động theo nội dung
        rulesButton.style.minWidth = '100px'; // Chiều rộng tối thiểu
        rulesButton.style.maxWidth = '140px'; // Chiều rộng tối đa
        rulesButton.style.color='white';
        
        rulesButton.addEventListener('mouseenter', () => {
            rulesButton.style.backgroundColor = '#21bad9'; // màu hover
        });
    
        rulesButton.addEventListener('mouseleave', () => {
            rulesButton.style.transform = 'scale(1)';
            rulesButton.style.backgroundColor = '#0dcaf0'; // trở lại màu gốc
        });
        // Thêm sự kiện click
        rulesButton.addEventListener('click', showRules);
        
        // Thêm nút vào bên dưới nút PLAY NOW
        document.querySelector('#play-now').parentNode.appendChild(rulesButton);
    }
    
    /**
     * Hiển thị hướng dẫn chơi
     */
    function showRules() {
        // Ẩn các panel khác
        setupPanel.style.display = 'none';
        gamePanel.style.display = 'none';
        
        // Hiện panel hướng dẫn
        document.getElementById('rules-panel').style.display = 'block';
    }
    
    /**
     * Quay lại từ hướng dẫn chơi
     */
    function exitRules() {
        // Ẩn panel hướng dẫn
        document.getElementById('rules-panel').style.display = 'none';
        
        // Hiện lại setup panel
        setupPanel.style.display = '';
        setupPanel.className = 'row justify-content-center mb-4';
    }
    function createResultModal() {
        // Tạo modal HTML với kích thước nhỏ hơn và hình ảnh lớn hơn
        const modalHTML = `
        <div class="modal fade" id="result-modal" tabindex="-1" aria-labelledby="resultModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header py-2">
                        <h5 class="modal-title small" id="resultModalLabel">Game Result</h5>
                        <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center p-2">
                        <img id="result-image" src="" alt="Game Result" class="img-fluid mb-2" style="max-height: 250px;">
                        <div id="result-message" class="small fw-bold"></div>
                    </div>
                    <div class="modal-footer py-1">
                        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-sm btn-primary" id="play-again-btn">Play Again</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Thêm modal vào body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Thêm event listener cho nút Play Again
        document.getElementById('play-again-btn').addEventListener('click', () => {
            const resultModal = bootstrap.Modal.getInstance(document.getElementById('result-modal'));
            resultModal.hide();
            resetGame();
        });
    }

    function showResultWithImage(resultType, message) {
        // Lấy các phần tử modal
        const resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
        const resultMessage = document.getElementById('result-message');
        const resultImage = document.getElementById('result-image');
        
        // Cập nhật nội dung
        resultMessage.textContent = message;
        resultImage.src = gameImages[resultType];
        resultImage.alt = `Game ${resultType}`;
        
        // Hiển thị modal
        resultModal.show();
        
        // Dừng bộ đếm thời gian
        if (timerInterval) {
            clearInterval(timerInterval);
        }
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
            if (result.winner === game.playerSymbol) {
                // Người chơi thắng
                showResultWithImage('win', "Congratulations! You won!");
            } else {
                // AI thắng
                showResultWithImage('lose', "Game over! You lost!");
            }
        } else if (result.gameOver && result.draw) {
            gameStatus.classList.add('alert-info');
            showResultWithImage('draw', "Game ended in a draw!");
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
        // Switch back to setup panel
        gamePanel.style.display = 'none';
        setupPanel.style.display = ''; // Đổi 'block' thành '' để giữ nguyên style ban đầu
        setupPanel.className = 'row justify-content-center mb-4';
        headlines.style.display = 'block';
        
        // Reset game status
        updateGameStatus(null);
    }
    
    // Initialize the UI
    init();
});
