// PONG Game Implementation
window.Game = {
    initialized: false,
    finished: false,
    
    // Game variables
    gameVars: {
        score: 1,
        otherScore: 1,
        WINNING_SCORE: 5,
        MAX_ANGLE: 5 * Math.PI / 12,
        angle: -Math.PI / 7,
        // Fixed dimensions
        ARENA_WIDTH: 800,
        ARENA_HEIGHT: 500,
        PADDLE_WIDTH: 20,
        PADDLE_HEIGHT: 200,
        BALL_SIZE: 20
    },
    
    gameObjects: null,
    animationId: null,
    
    // Initialize game
    init: function() {
        console.log('Initializing game...');
        
        // If already initialized, clean up first
        if (this.initialized) {
            this.cleanup();
        }
        
        // Wait for DOM elements to be ready
        if (!document.querySelector('.arena')) {
            console.log('Game elements not ready, waiting...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.initialized = true;
        
        // Initialize game elements
        this.elements = {
            player: document.querySelector(".player"),
            arena: document.querySelector(".arena"),
            ball: document.querySelector(".ball"),
            playerScore: document.querySelector('#score1'),
            computerScore: document.querySelector('#score2'),
            player1Name: document.querySelector('#player1Name span'),
            player2Name: document.querySelector('#player2Name span'),
            finishButton: document.getElementById('finishGame')
        };
        
        // Hide finish button initially
        if (this.elements.finishButton) {
            this.elements.finishButton.style.display = 'none';
        }
        
        // Reset scores
        if (this.elements.playerScore) this.elements.playerScore.textContent = '0';
        if (this.elements.computerScore) this.elements.computerScore.textContent = '0';
        
        // Check for tournament match
        const matchData = this.getMatchData();
        
        // Set winning score for tournament matches if needed
        if (matchData.isTournament) {
            this.gameVars.WINNING_SCORE = 3;
        }
        
        // Setup player names
        this.setupPlayerNames();
        
        // Initialize game objects
        this.setupGameObjects();
        
        // Setup controls
        this.setupControls();
        
        // Start game loop
        this.startGameLoop();
    },
    
    // Get match data from localStorage
    getMatchData: function() {
        const currentMatch = JSON.parse(localStorage.getItem('currentMatch') || '{}');
        
        // If no match data, use defaults
        if (!currentMatch.player1) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const playerName = userData.name || document.getElementById('userName')?.textContent || 'Player 1';
            
            return {
                player1: playerName,
                player2: 'Player 2',
                isTournament: false
            };
        }
        
        return {
            ...currentMatch,
            isTournament: !!currentMatch.id // It's a tournament match if it has an ID
        };
    },
    
    // Setup player names
    setupPlayerNames: function() {
        const currentMatch = JSON.parse(localStorage.getItem('currentMatch') || '{}');
        if (currentMatch && currentMatch.player1 && this.elements.player1Name) {
            this.elements.player1Name.textContent = currentMatch.player1;
        }
        if (currentMatch && currentMatch.player2 && this.elements.player2Name) {
            this.elements.player2Name.textContent = currentMatch.player2;
        }
    },
    
    // Initialize game objects
    setupGameObjects: function() {
        const self = this;
        let FistPlayer = 0;
        
        class PlayerObj {
            constructor() {
                this.Name = "Player";
                this.MoveUp = false;
                this.MoveDown = false;
                this.keyUP = 'w';
                this.keyDown = 's';
                this.speed = 14;
                if(!FistPlayer){
                    this.element = self.elements.player.cloneNode(true);
                    self.elements.arena.appendChild(this.element);
                    FistPlayer = 1;
                }
                else{
                    this.element = self.elements.player;
                }
                this.Height = this.element.clientHeight;
                this.Width = this.element.clientWidth;
                this.x = -this.Width / 2;
                this.y = self.elements.arena.clientHeight / 2 - this.Height / 2;
                this.element.style.left = `${this.x}px`;
                this.setupControls();
            }
            
            movePlayer(){
                if (this.MoveUp)
                    this.y = Math.max(this.y - this.speed, 0);
                if (this.MoveDown)
                    this.y = Math.min(this.y + this.speed, self.elements.arena.clientHeight - this.Height);
                this.element.style.top =`${this.y}px`;
            }
            
            setNewKey(newKeyUp, newKeyDown) {
                this.keyUP = newKeyUp;
                this.keyDown = newKeyDown;
            }
            
            setNewX(newPostionX) {
                this.x = newPostionX;
                this.element.style.left = `${newPostionX}px`;
            }
            
            setName(newName) {
                this.Name = newName;
            }
            
            setupControls() {
                document.addEventListener('keydown', (event) => {
                    if (event.key === this.keyUP) {
                        this.MoveUp = true;
                    } else if (event.key === this.keyDown) {
                        this.MoveDown = true;
                    }
                });
                
                document.addEventListener('keyup', (event) => {
                    if (event.key === this.keyUP) {
                        this.MoveUp = false;
                    } else if (event.key === this.keyDown) {
                        this.MoveDown = false;
                    }
                });
            }
        }
        
        class BallObj {
            constructor() {
                this.Name = "ball";
                this.x = self.elements.arena.clientWidth / 2 - self.elements.ball.clientWidth / 2;
                this.y = self.elements.arena.clientHeight / 2 - self.elements.ball.clientHeight / 2;
                this.speed = 4;
                this.r = self.elements.ball.clientWidth;
                
                self.elements.ball.style.left = `${this.x}px`;
                self.elements.ball.style.top = `${this.y}px`;
            }
            
            moveBall(p1, p2){
                this.x = this.x + this.speed * Math.cos(self.gameVars.angle);
                this.y = this.y - this.speed * Math.sin(self.gameVars.angle);
                
                self.elements.ball.style.left = `${this.x}px`;
                self.elements.ball.style.top = `${this.y}px`;
                
                if (this.y > self.elements.arena.clientHeight - 15 || this.y <= 0) {
                    self.gameVars.angle = (self.gameVars.angle * -1) % (Math.PI * 2);
                }
                else if(this.x > self.elements.arena.clientWidth - p2.Width / 2 - 1 - this.r && 
                        Math.abs(this.y - (p2.y + p2.Height / 2)) <= p2.Height / 2) {
                    this.speed *= 1.05;
                    self.gameVars.angle = (this.y - (p2.y + p2.Height / 2)) / (p2.Height / 2) * self.gameVars.MAX_ANGLE - Math.PI;
                }
                else if(this.x < p1.Width / 2 + 1 && Math.abs(this.y - (p1.y + p1.Height / 2)) <= p1.Height / 2) {
                    this.speed *= 1.05;
                    self.gameVars.angle = -(this.y - (p1.y + p1.Height / 2)) / (p1.Height / 2) * self.gameVars.MAX_ANGLE;
                }
                else if(this.x < 0) {
                    this.speed = 4;
                    self.gameVars.angle = Math.PI / 7;
                    this.x = self.elements.arena.clientWidth / 2 - self.elements.ball.clientWidth / 2;
                    this.y = self.elements.arena.clientHeight / 2 - self.elements.ball.clientHeight / 2;
                    self.elements.computerScore.textContent = self.gameVars.score;
                    self.gameVars.score++;
                    
                    // Check for game end
                    self.checkGameEnd();
                }
                else if(this.x >= self.elements.arena.clientWidth - this.r) {
                    this.speed = 4;
                    self.gameVars.angle = Math.PI - Math.PI / 7;
                    this.x = self.elements.arena.clientWidth / 2 - self.elements.ball.clientWidth / 2;
                    this.y = self.elements.arena.clientHeight / 2 - self.elements.ball.clientHeight / 2;
                    self.elements.playerScore.textContent = self.gameVars.otherScore;
                    self.gameVars.otherScore++;
                    
                    // Check for game end
                    self.checkGameEnd();
                }
            }
        }
        
        // Initialize game objects
        this.gameObjects = {
            p1: new PlayerObj(),
            p2: new PlayerObj(),
            ball: new BallObj()
        };
        
        // Setup player 2
        this.gameObjects.p2.setNewKey('ArrowUp', 'ArrowDown');
        this.gameObjects.p2.setName('computer');
        this.gameObjects.p2.setNewX(this.elements.arena.clientWidth - this.gameObjects.p2.Width / 2);
        this.gameObjects.p2.element.style.background = '#032a6ceb';
    },
    
    // Check if game has ended
    checkGameEnd: function() {
        if (this.gameVars.score >= this.gameVars.WINNING_SCORE || 
            this.gameVars.otherScore >= this.gameVars.WINNING_SCORE) {
            if (!this.finished) {
                this.finished = true;
                
                // Get match data
                const currentMatch = JSON.parse(localStorage.getItem('currentMatch') || '{}');
                
                // Determine the winner
                const winner = this.gameVars.score > this.gameVars.otherScore ? 
                    currentMatch.player2 : currentMatch.player1;
                
                // Format the score (swap if needed to show winner's score first)
                const score = this.gameVars.score > this.gameVars.otherScore ? 
                    `${this.gameVars.score}-${this.gameVars.otherScore}` : 
                    `${this.gameVars.otherScore}-${this.gameVars.score}`;
                
                // Store match result for tournament
                localStorage.setItem('matchResult', JSON.stringify({
                    winner: winner,
                    score: score,
                    matchId: currentMatch.id
                }));
                
                // Show finish button
                if (this.elements.finishButton) {
                    if (currentMatch.id) {
                        // Tournament match
                        this.elements.finishButton.textContent = `${winner} wins! Return to Tournament`;
                    } else {
                        // Normal match
                        this.elements.finishButton.textContent = 'Return to Home';
                    }
                    this.elements.finishButton.style.display = 'flex';
                }
            }
        }
    },
    
    // Start game loop
    startGameLoop: function() {
        const loop = () => {
            if (!this.finished) {
                this.gameObjects.p1.movePlayer();
                this.gameObjects.p2.movePlayer();
                this.gameObjects.ball.moveBall(this.gameObjects.p1, this.gameObjects.p2);
                this.animationId = requestAnimationFrame(loop);
            }
        };
        
        this.animationId = requestAnimationFrame(loop);
    },
    
    // Setup control buttons
    setupControls: function() {
        // Finish button
        if (this.elements.finishButton) {
            this.elements.finishButton.addEventListener('click', () => {
                // Get match data to determine where to return
                const currentMatch = JSON.parse(localStorage.getItem('currentMatch') || '{}');
                
                // Clean up game
                this.cleanup();
                
                // Navigate based on match type
                if (currentMatch.id) {
                    // Tournament match - return to tournament
                    if (typeof window.showView === 'function') {
                        window.showView('tournament');
                    } else {
                        window.location.href = '/tournament';
                    }
                } else {
                    // Normal match - return to home
                    if (typeof window.showView === 'function') {
                        window.showView('home');
                    } else {
                        window.location.href = '/home';
                    }
                }
            });
        }
        
        // Store event handlers for cleanup
        this._keydownHandler = (event) => {
            if (event.key === 'Escape') {
                this.cleanup();
                window.showView('home');
            }
        };
        
        // Add event listeners
        document.addEventListener('keydown', this._keydownHandler);
    },
    
    // Clean up game
    cleanup: function() {
        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this._keydownHandler);
        
        // Reset game state
        this.gameVars.score = 1;
        this.gameVars.otherScore = 1;
        this.gameVars.angle = -Math.PI / 7;
        
        // Reset flags
        this.initialized = false;
        this.finished = false;
        
        // Clear game objects
        this.gameObjects = null;
        
        // Hide finish button
        if (this.elements && this.elements.finishButton) {
            this.elements.finishButton.style.display = 'none';
        }
    },
    
    // Reset game
    reset: function() {
        this.cleanup();
        this.gameVars = {
            score: 1,
            otherScore: 1,
            WINNING_SCORE: 5,
            MAX_ANGLE: 5 * Math.PI / 12,
            angle: -Math.PI / 7,
            ARENA_WIDTH: 800,
            ARENA_HEIGHT: 500,
            PADDLE_WIDTH: 20,
            PADDLE_HEIGHT: 200,
            BALL_SIZE: 20
        };
    }
};

// Export game functions
window.initializeGame = function() {
    window.Game.init();
};

window.cleanupGame = function() {
    window.Game.cleanup();
};

window.resetGame = function() {
    window.Game.reset();
}; 