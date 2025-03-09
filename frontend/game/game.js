// PONG Game Core Engine
window.GameEngine = {
    initialized: false,
    finished: false,
    
    // Game state variables
    gameVars: {
        score1: 0,
        score2: 0,
        WINNING_SCORE: 5,
        MAX_ANGLE: 5 * Math.PI / 12,
        angle: -Math.PI / 7,
    },
    
    // Game dimensions
    dimensions: {
        arenaWidth: 800,
        arenaHeight: 500,
        paddleWidth: 20,
        paddleHeight: 200,
        ballSize: 20
    },
    
    // Elements, objects and animation refs
    elements: null,
    gameObjects: null,
    animationId: null,
    handlers: {},
    
    // Initialize core game engine
    init: function(options = {}) {
        console.log('Initializing game engine...');
        
        // If already initialized, clean up first
        if (this.initialized) {
            this.cleanup();
        }
        
        // Apply custom options
        if (options.winningScore) this.gameVars.WINNING_SCORE = options.winningScore;
        if (options.onGameOver) this.onGameOver = options.onGameOver;
        
        // Make sure required elements exist
        if (!document.querySelector('.arena')) {
            console.log('Game elements not ready, waiting...');
            setTimeout(() => this.init(options), 100);
            return;
        }
        
        // Reset scores
        this.gameVars.score1 = 0;
        this.gameVars.score2 = 0;
        this.gameVars.angle = -Math.PI / 7;
        this.finished = false;
        
        // Get elements
        this.getElements();
        
        // Reset display
        if (this.elements.playerScore) this.elements.playerScore.textContent = '0';
        if (this.elements.computerScore) this.elements.computerScore.textContent = '0';
        
        // Setup player names
        this.setupPlayerNames(options.player1, options.player2);
        
        // Initialize game objects
        this.setupGameObjects();
        
        // Setup controls
        this.setupControls();
        
        // Mark as initialized
        this.initialized = true;
        
        // Start game loop
        this.startGameLoop();
        
        return this; // For chaining
    },
    
    // Get all necessary DOM elements
    getElements: function() {
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
    },
    
    // Set player names
    setupPlayerNames: function(player1, player2) {
        console.log(`Setting up game with players: ${player1} vs ${player2}`);
        
        // Clear any existing content first to prevent duplication
        if (this.elements.player1Name) {
            this.elements.player1Name.innerHTML = '';
            const p1Icon = document.createElement('i');
            p1Icon.className = 'fas fa-user';
            this.elements.player1Name.appendChild(p1Icon);
            
            const p1Text = document.createElement('span');
            p1Text.textContent = player1 || 'Player 1';
            this.elements.player1Name.appendChild(p1Text);
        }
        
        if (this.elements.player2Name) {
            this.elements.player2Name.innerHTML = '';
            const p2Icon = document.createElement('i');
            p2Icon.className = 'fas fa-user';
            this.elements.player2Name.appendChild(p2Icon);
            
            const p2Text = document.createElement('span');
            p2Text.textContent = player2 || 'Player 2';
            this.elements.player2Name.appendChild(p2Text);
        }
    },
    
    // Game over handler - can be overridden
    onGameOver: function(winner, score1, score2) {
        console.log(`Game over. Winner: ${winner}, Score: ${score1}-${score2}`);
        
        // Show finish button
        if (this.elements.finishButton) {
            this.elements.finishButton.style.display = 'flex';
        }
    },
    
    // Other methods (setupGameObjects, startGameLoop, etc.) remain similar...
    setupGameObjects: function() {
        const self = this;
        let firstPlayer = 0;
        
        class PlayerObj {
            constructor() {
                this.Name = "Player";
                this.MoveUp = false;
                this.MoveDown = false;
                this.keyUP = 'w';
                this.keyDown = 's';
                this.speed = 14;
                if(!firstPlayer){
                    this.element = self.elements.player.cloneNode(true);
                    self.elements.arena.appendChild(this.element);
                    firstPlayer = 1;
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
                self.handlers.keydown = (event) => {
                    if (event.key === this.keyUP) {
                        this.MoveUp = true;
                    } else if (event.key === this.keyDown) {
                        this.MoveDown = true;
                    }
                };

                self.handlers.keyup = (event) => {
                    if (event.key === this.keyUP) {
                        this.MoveUp = false;
                    } else if (event.key === this.keyDown) {
                        this.MoveDown = false;
                    }
                };
                
                document.addEventListener('keydown', self.handlers.keydown);
                document.addEventListener('keyup', self.handlers.keyup);
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
                    if (self.elements.computerScore) {
                        self.gameVars.score2++;
                        self.elements.computerScore.textContent = self.gameVars.score2;
                    }
                }
                else if(this.x >= self.elements.arena.clientWidth - this.r) {
                    this.speed = 4;
                    self.gameVars.angle = Math.PI - Math.PI / 7;
                    this.x = self.elements.arena.clientWidth / 2 - self.elements.ball.clientWidth / 2;
                    this.y = self.elements.arena.clientHeight / 2 - self.elements.ball.clientHeight / 2;
                    if (self.elements.playerScore) {
                        self.gameVars.score1++;
                        self.elements.playerScore.textContent = self.gameVars.score1;
                    }
                }

                // Check for game over
                if (self.gameVars.score1 >= self.gameVars.WINNING_SCORE || 
                    self.gameVars.score2 >= self.gameVars.WINNING_SCORE) {
                    if (!self.finished) {
                        self.finished = true;
                        
                        // Get player names
                        const p1Name = self.elements.player1Name ? self.elements.player1Name.textContent : 'Player 1';
                        const p2Name = self.elements.player2Name ? self.elements.player2Name.textContent : 'Player 2';
                        
                        // Determine winner
                        const winner = self.gameVars.score1 > self.gameVars.score2 ? p1Name : p2Name;
                        
                        // Call the onGameOver handler if available
                        if (typeof self.onGameOver === 'function') {
                            self.onGameOver.call(self, winner, self.gameVars.score1, self.gameVars.score2);
                        }
                    }
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
        this.gameObjects.p1.element.style.background = '#c70082a1';
    },
    
    // Start game loop
    startGameLoop: function() {
        // Check if game is still initialized (not cleaned up)
        if (!this.initialized) return;
        
        // Move players
        if (this.gameObjects && this.gameObjects.p1) {
            this.gameObjects.p1.movePlayer();
        }
        if (this.gameObjects && this.gameObjects.p2) {
            this.gameObjects.p2.movePlayer();
        }
        
        // Move ball
        if (this.gameObjects && this.gameObjects.ball) {
            this.gameObjects.ball.moveBall(this.gameObjects.p1, this.gameObjects.p2);
        }
        
        // Continue animation loop if not finished
        if (!this.finished) {
            this.animationId = requestAnimationFrame(() => this.startGameLoop());
        }
    },
    
    // Setup control buttons
    setupControls: function() {
        // Player movement handlers
        this.handlers.keydown = (event) => {
            if (event.key === 'w') {
                if (this.gameObjects && this.gameObjects.p1) {
                    this.gameObjects.p1.MoveUp = true;
                }
            } else if (event.key === 's') {
                if (this.gameObjects && this.gameObjects.p1) {
                    this.gameObjects.p1.MoveDown = true;
                }
            } else if (event.key === 'ArrowUp') {
                if (this.gameObjects && this.gameObjects.p2) {
                    this.gameObjects.p2.MoveUp = true;
                }
            } else if (event.key === 'ArrowDown') {
                if (this.gameObjects && this.gameObjects.p2) {
                    this.gameObjects.p2.MoveDown = true;
                }
            }
        };

        this.handlers.keyup = (event) => {
            if (event.key === 'w') {
                if (this.gameObjects && this.gameObjects.p1) {
                    this.gameObjects.p1.MoveUp = false;
                }
            } else if (event.key === 's') {
                if (this.gameObjects && this.gameObjects.p1) {
                    this.gameObjects.p1.MoveDown = false;
                }
            } else if (event.key === 'ArrowUp') {
                if (this.gameObjects && this.gameObjects.p2) {
                    this.gameObjects.p2.MoveUp = false;
                }
            } else if (event.key === 'ArrowDown') {
                if (this.gameObjects && this.gameObjects.p2) {
                    this.gameObjects.p2.MoveDown = false;
                }
            }
        };

        // Attach event listeners
        document.addEventListener('keydown', this.handlers.keydown);
        document.addEventListener('keyup', this.handlers.keyup);
        
        // Finish button
        if (this.elements.finishButton) {
            this.handlers.finish = () => {
                this.cleanup();
                window.showView && window.showView('home');
            };
            
            this.elements.finishButton.addEventListener('click', this.handlers.finish);
        }
        
        // Escape key to exit
        this.handlers.keydownEscape = (event) => {
            if (event.key === 'Escape') {
                this.cleanup();
                window.showView && window.showView('home');
            }
        };
        
        document.addEventListener('keydown', this.handlers.keydownEscape);
    },
    
    // Clean up all resources
    cleanup: function() {
        console.log('Cleaning up game engine');
        
        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove all event listeners
        if (this.handlers.keydown) {
            document.removeEventListener('keydown', this.handlers.keydown);
        }
        if (this.handlers.keyup) {
            document.removeEventListener('keyup', this.handlers.keyup);
        }
        if (this.handlers.keydownEscape) {
            document.removeEventListener('keydown', this.handlers.keydownEscape);
        }
        if (this.handlers.finish && this.elements && this.elements.finishButton) {
            this.elements.finishButton.removeEventListener('click', this.handlers.finish);
        }
        
        // Reset game state
        this.gameVars = {
            score1: 0,
            score2: 0,
            WINNING_SCORE: 5,
            MAX_ANGLE: 5 * Math.PI / 12,
            angle: -Math.PI / 7
        };
        
        // Reset flags and references
        this.initialized = false;
        this.finished = false;
        this.gameObjects = null;
        this.handlers = {};
        
        // Reset UI elements if they exist
        if (this.elements) {
            if (this.elements.finishButton) {
                this.elements.finishButton.style.display = 'none';
            }
            if (this.elements.playerScore) {
                this.elements.playerScore.textContent = '0';
            }
            if (this.elements.computerScore) {
                this.elements.computerScore.textContent = '0';
            }
            
            // Reset player name elements to prevent duplication
            if (this.elements.player1Name) {
                this.elements.player1Name.innerHTML = '<i class="fas fa-user"></i><span>Player 1</span>';
            }
            if (this.elements.player2Name) {
                this.elements.player2Name.innerHTML = '<i class="fas fa-user"></i><span>Player 2</span>';
            }
        }
    }
};

// Standard Game Interface (for direct game view)
window.Game = {
    // Initialize the regular game
    init: function() {
        // Clear any tournament data to ensure we're running a regular game
        localStorage.removeItem('currentMatch');
        
        // Get player names
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const player1 = userData.name || document.getElementById('userName')?.textContent || 'Player 1';
        
        // Initialize the game engine with standard settings
        window.GameEngine.init({
            player1: player1,
            player2: 'Player 2',
            winningScore: 5,
            onGameOver: function(winner, score1, score2) {
                console.log(`Regular game over: ${winner} wins ${score1}-${score2}`);
                
                if (this.elements.finishButton) {
                    this.elements.finishButton.textContent = 'Return to Home';
                    this.elements.finishButton.style.display = 'flex';
                }
            }
        });
    },
    
    // Cleanup function
    cleanup: function() {
        if (window.GameEngine) {
            window.GameEngine.cleanup();
        }
    },
    
    // Reset function
    reset: function() {
        this.cleanup();
    }
};

// Export functions for external use
window.initializeGame = function() {
    window.Game.init();
};

window.cleanupGame = function() {
    window.Game.cleanup();
};

window.resetGame = function() {
    window.Game.reset();
}; 