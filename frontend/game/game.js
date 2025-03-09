// PONG Game Implementation
const Game = {
    // Game state
    initialized: false,
    finished: false,
    
    // Game settings
    settings: {
        winningScore: 5,
        maxAngle: 5 * Math.PI / 12,
        arenaWidth: 800,
        arenaHeight: 500,
        paddleWidth: 20,
        paddleHeight: 100,
        ballSize: 20
    },
    
    // Game data
    data: {
        score1: 0,
        score2: 0,
        angle: -Math.PI / 7
    },
    
    // Game objects
    objects: null,
    
    // Animation frame ID for cleanup
    animationId: null,
    
    // Initialize game
    init: function() {
        console.log('Initializing game...');
        
        // If already initialized, clean up first
        if (this.initialized) {
            this.cleanup();
        }
        
        // Get game elements
        if (!this.getElements()) {
            console.log('Game elements not found, retrying...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Reset game state
        this.data.score1 = 0;
        this.data.score2 = 0;
        this.finished = false;
        
        // Get match data
        const matchData = this.getMatchData();
        
        // Set player names
        this.updatePlayerNames(matchData);
        
        // Set winning score for tournament matches
        if (matchData.isTournament) {
            this.settings.winningScore = 3;
        }
        
        // Reset arena
        this.resetArena();
        
        // Initialize game objects
        this.initializeGameObjects();
        
        // Set up controls
        this.setupControls();
        
        // Start game loop
        this.startGameLoop();
        
        // Mark as initialized
        this.initialized = true;
        
        console.log('Game initialized with match data:', matchData);
    },
    
    // Get game elements
    getElements: function() {
        // Wait for elements to be available
        const arena = document.querySelector('.arena');
        if (!arena) return false;
        
        this.elements = {
            arena: arena,
            playerScore: document.querySelector('#score1'),
            computerScore: document.querySelector('#score2'),
            player1Name: document.querySelector('#player1Name span'),
            player2Name: document.querySelector('#player2Name span'),
            finishButton: document.getElementById('finishGame')
        };
        
        return true;
    },
    
    // Get match data from localStorage
    getMatchData: function() {
        const matchData = JSON.parse(localStorage.getItem('currentMatch') || '{}');
        
        // If no player1, use logged-in user
        if (!matchData.player1) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            matchData.player1 = userData.name || 'Player 1';
        }
        
        // If no player2, use default
        if (!matchData.player2) {
            matchData.player2 = 'Player 2';
        }
        
        return matchData;
    },
    
    // Update player names
    updatePlayerNames: function(matchData) {
        if (this.elements.player1Name) {
            this.elements.player1Name.textContent = matchData.player1;
        }
        
        if (this.elements.player2Name) {
            this.elements.player2Name.textContent = matchData.player2;
        }
        
        // Reset score display
        if (this.elements.playerScore) {
            this.elements.playerScore.textContent = '0';
        }
        
        if (this.elements.computerScore) {
            this.elements.computerScore.textContent = '0';
        }
    },
    
    // Reset arena
    resetArena: function() {
        const arena = this.elements.arena;
        if (!arena) return;
        
        // Clear and rebuild arena contents with TWO player elements
        arena.innerHTML = `
            <div class="player player1"></div>
            <div class="player player2"></div>
            <div class="ball"></div>
            <div class="half-line"></div>
        `;
    },
    
    // Initialize game objects
    initializeGameObjects: function() {
        // Prepare game classes
        class GameObject {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.Width = 0;
                this.Height = 0;
                this.element = null;
                this.speed = 0;
            }
            
            updatePosition() {
                if (this.element) {
                    this.element.style.left = `${this.x - this.Width / 2}px`;
                    this.element.style.top = `${this.y - this.Height / 2}px`;
                }
            }
        }
        
        class PlayerObj extends GameObject {
            constructor(elementSelector) {
                super();
                this.element = document.querySelector(elementSelector);
                this.Width = Game.settings.paddleWidth;
                this.Height = Game.settings.paddleHeight;
                this.speed = 10;
                this.upKey = 'w';
                this.downKey = 's';
                this.keys = {};
                this.name = 'player';
                this.x = this.Width / 2 + 20;
                this.y = Game.elements.arena.clientHeight / 2;
                this.updatePosition();
                
                // Set up key event handlers
                this.setupEventListeners();
            }
            
            setupEventListeners() {
                window.addEventListener('keydown', (e) => {
                    this.keys[e.key.toLowerCase()] = true;
                });
                
                window.addEventListener('keyup', (e) => {
                    this.keys[e.key.toLowerCase()] = false;
                });
            }
            
            setNewKey(up, down) {
                this.upKey = up.toLowerCase();
                this.downKey = down.toLowerCase();
            }
            
            setName(name) {
                this.name = name;
            }
            
            setNewX(x) {
                this.x = x;
                this.updatePosition();
            }
            
            movePlayer() {
                const arenaHeight = Game.elements.arena.clientHeight;
                
                if (this.keys[this.upKey] && this.y - this.Height / 2 > 0) {
                    this.y -= this.speed;
                }
                
                if (this.keys[this.downKey] && this.y + this.Height / 2 < arenaHeight) {
                    this.y += this.speed;
                }
                
                // AI for player 2
                if (this.name === 'computer') {
                    const ball = Game.objects.ball;
                    
                    // Simple AI - follow the ball with slight delay
                    if (Math.abs(this.y - ball.y) > this.Height / 6) {
                        if (this.y < ball.y) {
                            this.y += this.speed * 0.7;
                        } else {
                            this.y -= this.speed * 0.7;
                        }
                    }
                }
                
                this.updatePosition();
            }
        }
        
        class BallObj extends GameObject {
            constructor() {
                super();
                this.element = document.querySelector('.ball');
                this.Width = Game.settings.ballSize;
                this.Height = Game.settings.ballSize;
                this.speed = 7;
                this.xDirection = 1;
                this.yDirection = Math.random() < 0.5 ? -1 : 1;
                this.x = Game.elements.arena.clientWidth / 2;
                this.y = Game.elements.arena.clientHeight / 2;
                this.updatePosition();
            }
            
            reset() {
                this.x = Game.elements.arena.clientWidth / 2;
                this.y = Game.elements.arena.clientHeight / 2;
                this.xDirection = this.xDirection > 0 ? -1 : 1; // Serve to the other player
                this.yDirection = Math.random() < 0.5 ? -1 : 1;
                this.updatePosition();
            }
            
            moveBall(player1, player2) {
                const arenaWidth = Game.elements.arena.clientWidth;
                const arenaHeight = Game.elements.arena.clientHeight;
                
                // Update position
                this.x += this.speed * this.xDirection;
                this.y += this.speed * this.yDirection * Math.sin(Game.data.angle);
                
                // Handle wall collisions
                if (this.y - this.Height / 2 < 0 || this.y + this.Height / 2 > arenaHeight) {
                    this.yDirection *= -1;
                }
                
                // Handle scoring (left wall)
                if (this.x - this.Width / 2 < 0) {
                    Game.updateScore('player2');
                    this.reset();
                    return;
                }
                
                // Handle scoring (right wall)
                if (this.x + this.Width / 2 > arenaWidth) {
                    Game.updateScore('player1');
                    this.reset();
                    return;
                }
                
                // Check collision with player 1
                if (this.checkCollision(player1)) {
                    this.xDirection = 1;
                    Game.data.angle = ((this.y - player1.y) / player1.Height) * Game.settings.maxAngle;
                }
                
                // Check collision with player 2
                if (this.checkCollision(player2)) {
                    this.xDirection = -1;
                    Game.data.angle = ((this.y - player2.y) / player2.Height) * Game.settings.maxAngle;
                }
                
                this.updatePosition();
            }
            
            checkCollision(player) {
                return (
                    this.x - this.Width / 2 < player.x + player.Width / 2 &&
                    this.x + this.Width / 2 > player.x - player.Width / 2 &&
                    this.y - this.Height / 2 < player.y + player.Height / 2 &&
                    this.y + this.Height / 2 > player.y - player.Height / 2
                );
            }
        }
        
        // Create game objects with the correct element selectors
        this.objects = {
            player1: new PlayerObj('.player1'),
            player2: new PlayerObj('.player2'),
            ball: new BallObj()
        };
        
        // Configure player 2
        this.objects.player2.setNewKey('ArrowUp', 'ArrowDown');
        this.objects.player2.setName('computer');
        this.objects.player2.setNewX(this.elements.arena.clientWidth - this.objects.player2.Width / 2 - 20);
        this.objects.player2.element.style.background = '#032a6ceb';
    },
    
    // Set up game controls
    setupControls: function() {
        const finishButton = this.elements.finishButton;
        if (finishButton) {
            finishButton.style.display = 'none';
            
            finishButton.onclick = () => {
                if (this.finished) {
                    this.cleanup();
                    if (typeof window.showView === 'function') {
                        window.showView('home');
                    } else {
                        window.location.href = '#home';
                    }
                }
            };
        }
    },
    
    // Start game loop
    startGameLoop: function() {
        const self = this;
        
        function loop() {
            if (!self.finished) {
                self.objects.player1.movePlayer();
                self.objects.player2.movePlayer();
                self.objects.ball.moveBall(self.objects.player1, self.objects.player2);
                self.animationId = requestAnimationFrame(loop);
            }
        }
        
        this.animationId = requestAnimationFrame(loop);
    },
    
    // Update score
    updateScore: function(player) {
        if (player === 'player1') {
            this.data.score1++;
            if (this.elements.playerScore) {
                this.elements.playerScore.textContent = this.data.score1;
            }
            
            if (this.data.score1 >= this.settings.winningScore) {
                this.handleGameEnd();
            }
        } else {
            this.data.score2++;
            if (this.elements.computerScore) {
                this.elements.computerScore.textContent = this.data.score2;
            }
            
            if (this.data.score2 >= this.settings.winningScore) {
                this.handleGameEnd();
            }
        }
    },
    
    // Handle game end
    handleGameEnd: function() {
        if (this.finished) return;
        
        this.finished = true;
        
        // Determine winner
        const player1Score = this.data.score1;
        const player2Score = this.data.score2;
        const player1Name = this.elements.player1Name.textContent.trim();
        const player2Name = this.elements.player2Name.textContent.trim();
        
        let winner, score;
        
        if (player1Score > player2Score) {
            winner = player1Name;
            score = `${player1Score}-${player2Score}`;
        } else {
            winner = player2Name;
            score = `${player2Score}-${player1Score}`;
        }
        
        // Check if this is a tournament match
        const currentMatch = JSON.parse(localStorage.getItem('currentMatch') || '{}');
        if (currentMatch.isTournament) {
            // Store match result for tournament
            localStorage.setItem('matchResult', JSON.stringify({
                winner: winner,
                score: score
            }));
            
            // Return to tournament view after delay
            setTimeout(() => {
                if (typeof window.showView === 'function') {
                    window.showView('tournament');
                } else {
                    window.location.href = '#tournament';
                }
            }, 1500);
        } else {
            // Show finish button for normal games
            if (this.elements.finishButton) {
                this.elements.finishButton.style.display = 'flex';
            }
        }
    },
    
    // Clean up game
    cleanup: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.initialized = false;
        this.finished = false;
        this.objects = null;
        
        // Reset data
        this.data = {
            score1: 0,
            score2: 0,
            angle: -Math.PI / 7
        };
        
        // Hide finish button
        if (this.elements && this.elements.finishButton) {
            this.elements.finishButton.style.display = 'none';
        }
    }
};

// Export game functions to window
window.initializeGame = function() {
    Game.init();
};

window.cleanupGame = function() {
    Game.cleanup();
};

window.Game = Game; 