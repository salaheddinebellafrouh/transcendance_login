// Initialize the space shooter game
window.SpaceShooter = {
    init: function() {
        console.log("Initializing Space Shooter game");
        
        const canvas = document.getElementById("gameCanvas");
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        const ctx = canvas.getContext("2d");
        
        // Set fixed dimensions for the canvas
        canvas.width = 800;
        canvas.height = 600;
        
        // Reset HP display
        const hpDisplay = document.getElementById('hp');
        if (hpDisplay) {
            hpDisplay.textContent = '3';
        }
        
        // Reset game over screen
        const gameOverScreen = document.getElementById('gameOver');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Add restart button event listener
        const restartGameBtn = document.getElementById('restartGameBtn');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                this.cleanup();
                this.init();
            });
        }
        
        // Also handle the in-game restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.cleanup();
                this.init();
            };
        }
        
        // Add return to home button
        const returnButton = document.createElement('button');
        returnButton.className = 'return-button';
        returnButton.innerHTML = '<i class="fas fa-arrow-left"></i> Return to Home';
        returnButton.addEventListener('click', () => {
            this.cleanup();
            window.location.hash = '/home';
        });
        document.querySelector('.game-container').appendChild(returnButton);
        
        // Game variables
        const player = {
            width: 50,
            height: 20,
            x: canvas.width / 2 - 25,
            y: canvas.height - 50,
            speed: 5,
            hp: 3,
            thrusterSize: 0,
            thrusterDir: 1,
            
            draw: function() {
                // Ship body
                ctx.fillStyle = "#4a89dc";
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height);
                ctx.lineTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.closePath();
                ctx.fill();
                
                // Ship details
                ctx.fillStyle = "#2a6dd4";
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 5);
                
                // Cockpit
                ctx.fillStyle = "#00ccff";
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + 7, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Thruster
                this.thrusterSize += 0.2 * this.thrusterDir;
                if (this.thrusterSize > 10 || this.thrusterSize < 0) this.thrusterDir *= -1;
                
                ctx.fillStyle = "#ff7700";
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y + this.height);
                ctx.lineTo(this.x + 20, this.y + this.height + 5 + this.thrusterSize);
                ctx.lineTo(this.x + 30, this.y + this.height);
                ctx.closePath();
                ctx.fill();
            },
            
            move: function(left, right) {
                if (left && this.x > 0) this.x -= this.speed;
                if (right && this.x < canvas.width - this.width) this.x += this.speed;
            }
        };
        
        const bullets = [];
        const bombs = [];
        const powerUps = [];
        const particles = [];
        const stars = [];
        
        // Create stars
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() + 0.5,
                update: function() {
                    this.y += this.speed;
                    if (this.y > canvas.height) {
                        this.y = 0;
                        this.x = Math.random() * canvas.width;
                    }
                },
                draw: function() {
                    ctx.fillStyle = "#ffffff";
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
        
        let score = 0;
        let lastShotTime = 0;
        let shotDelay = 300;
        let keys = { left: false, right: false, shoot: false };
        let gameActive = true;
        let animationId = null;
        let bombInterval = null;
        let powerUpInterval = null;
        
        // Game mechanics
        function spawnBomb() {
            if (!gameActive) return;
            
            bombs.push({
                x: Math.random() * (canvas.width - 30),
                y: 0,
                size: 30,
                speed: 2 + Math.random() * 2,
                rotation: 0,
                rotationSpeed: 0.05,
                update: function() {
                    this.y += this.speed;
                    this.rotation += this.rotationSpeed;
                },
                draw: function() {
                    ctx.save();
                    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
                    ctx.rotate(this.rotation);
                    
                    // Bomb body
                    ctx.fillStyle = "#ff3333";
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Bomb details
                    ctx.fillStyle = "#cc0000";
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
        }
        
        function spawnPowerUp() {
            if (!gameActive) return;
            
            powerUps.push({
                x: Math.random() * (canvas.width - 25),
                y: 0,
                size: 25,
                speed: 1.5 + Math.random(),
                type: Math.random() > 0.5 ? "hp" : "fast",
                update: function() {
                    this.y += this.speed;
                },
                draw: function() {
                    const glowColor = this.type === "hp" ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 255, 0.3)";
                    const bgColor = this.type === "hp" ? "#00aa00" : "#aa00aa";
                    
                    ctx.fillStyle = glowColor;
                    ctx.beginPath();
                    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2 + 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = bgColor;
                    ctx.beginPath();
                    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = "#ffffff";
                    if (this.type === "hp") {
                        // Health icon (plus)
                        ctx.fillRect(this.x + this.size / 2 - 2, this.y + 5, 4, 15);
                        ctx.fillRect(this.x + 5, this.y + this.size / 2 - 2, 15, 4);
                    } else {
                        // Speed icon (lightning)
                        ctx.beginPath();
                        ctx.moveTo(this.x + 10, this.y + 5);
                        ctx.lineTo(this.x + 15, this.y + 10);
                        ctx.lineTo(this.x + 12, this.y + 12);
                        ctx.lineTo(this.x + 17, this.y + 20);
                        ctx.lineTo(this.x + 10, this.y + 15);
                        ctx.lineTo(this.x + 13, this.y + 10);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            });
        }
        
        function createExplosion(x, y, color, count = 20) {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: x,
                    y: y,
                    size: Math.random() * 3 + 1,
                    speedX: Math.random() * 4 - 2,
                    speedY: Math.random() * 4 - 2,
                    color: color,
                    life: 30,
                    maxLife: 30,
                    update: function() {
                        this.x += this.speedX;
                        this.y += this.speedY;
                        this.life--;
                        this.size = Math.max(0.1, (this.life / this.maxLife) * 3);
                    },
                    draw: function() {
                        if (this.size > 0) {
                            ctx.fillStyle = this.color;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                });
            }
        }
        
        function gameOver() {
            gameActive = false;
            document.getElementById("gameOver").style.display = "block";
            returnButton.style.display = "block";
        }
        
        document.getElementById("restartBtn").addEventListener("click", () => {
            document.getElementById("gameOver").style.display = "none";
            gameActive = true;
            player.hp = 3;
            document.getElementById("hp").textContent = player.hp;
            
            // Clear game objects
            bombs.length = 0;
            bullets.length = 0;
            powerUps.length = 0;
            particles.length = 0;
            
            // Reset player position
            player.x = canvas.width / 2 - player.width / 2;
            player.y = canvas.height - player.height - 30;
        });
        
        function update() {
            if (!gameActive) return;
            
            // Update stars
            stars.forEach(star => star.update());
            
            // Update player
            player.move(keys.left, keys.right);
            
            // Shoot bullets
            if (keys.shoot && Date.now() - lastShotTime > shotDelay) {
                bullets.push({
                    x: player.x + player.width / 2 - 1.5,
                    y: player.y,
                    width: 3,
                    height: 15,
                    speed: 10,
                    update: function() {
                        this.y -= this.speed;
                    },
                    draw: function() {
                        ctx.fillStyle = "#00ccff";
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                    }
                });
                lastShotTime = Date.now();
            }
            
            // Update bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].update();
                if (bullets[i].y < 0) {
                    bullets.splice(i, 1);
                }
            }
            
            // Update bombs
            for (let i = bombs.length - 1; i >= 0; i--) {
                const bomb = bombs[i];
                bomb.update();
                
                // Collision with player
                if (
                    bomb.x + bomb.size / 2 > player.x &&
                    bomb.x + bomb.size / 2 < player.x + player.width &&
                    bomb.y + bomb.size / 2 > player.y &&
                    bomb.y + bomb.size / 2 < player.y + player.height
                ) {
                    player.hp--;
                    document.getElementById("hp").textContent = player.hp;
                    createExplosion(bomb.x + bomb.size / 2, bomb.y + bomb.size / 2, "#ff5555", 30);
                    bombs.splice(i, 1);
                    
                    if (player.hp <= 0) {
                        createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#4a89dc", 50);
                        gameOver();
                    }
                    continue;
                }
                
                // Remove bombs that exit the screen
                if (bomb.y - bomb.size > canvas.height) {
                    bombs.splice(i, 1);
                    continue;
                }
                
                // Collision with bullets
                for (let j = bullets.length - 1; j >= 0; j--) {
                    const bullet = bullets[j];
                    if (
                        bullet.x + bullet.width / 2 > bomb.x &&
                        bullet.x + bullet.width / 2 < bomb.x + bomb.size &&
                        bullet.y + bullet.height / 2 > bomb.y &&
                        bullet.y + bullet.height / 2 < bomb.y + bomb.size
                    ) {
                        createExplosion(bomb.x + bomb.size / 2, bomb.y + bomb.size / 2, "#ff5555", 20);
                        bullets.splice(j, 1);
                        bombs.splice(i, 1);
                        score += 10;
                        break;
                    }
                }
            }
            
            // Update powerups
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const powerUp = powerUps[i];
                powerUp.update();
                
                if (powerUp.y > canvas.height) {
                    powerUps.splice(i, 1);
                    continue;
                }
                
                // Collision with player
                if (
                    powerUp.x + powerUp.size / 2 > player.x &&
                    powerUp.x + powerUp.size / 2 < player.x + player.width &&
                    powerUp.y + powerUp.size / 2 > player.y &&
                    powerUp.y + powerUp.size / 2 < player.y + player.height
                ) {
                    if (powerUp.type === "hp") {
                        player.hp++;
                        createExplosion(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2, "#00ff00", 15);
                    }
                    if (powerUp.type === "fast") {
                        shotDelay = 100;
                        createExplosion(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2, "#ff00ff", 15);
                        setTimeout(() => shotDelay = 300, 5000);
                    }
                    document.getElementById("hp").textContent = player.hp;
                    powerUps.splice(i, 1);
                }
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }
        }
        
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw stars
            stars.forEach(star => star.draw());
            
            // Draw player if game is active
            if (gameActive) player.draw();
            
            // Draw game objects
            bullets.forEach(bullet => bullet.draw());
            bombs.forEach(bomb => bomb.draw());
            powerUps.forEach(powerUp => powerUp.draw());
            
            // Draw particles
            particles.forEach(particle => {
                if (particle.size > 0) {
                    particle.draw();
                }
            });
        }
        
        function gameLoop() {
            update();
            draw();
            animationId = requestAnimationFrame(gameLoop);
        }
        
        // Start game intervals
        bombInterval = setInterval(spawnBomb, 1500);
        powerUpInterval = setInterval(spawnPowerUp, 8000);
        
        // Start the game loop
        gameLoop();
        
        // Set up event listeners
        document.addEventListener("keydown", this.keyDownHandler);
        document.addEventListener("keyup", this.keyUpHandler);
        
        // Resize handler
        window.addEventListener("resize", this.resizeHandler);
        
        // Save all the references
        this.canvas = canvas;
        this.ctx = ctx;
        this.player = player;
        this.keys = keys;
        this.animationId = animationId;
        this.bombInterval = bombInterval;
        this.powerUpInterval = powerUpInterval;
        this.returnButton = returnButton;
    },
    
    // Event handlers
    keyDownHandler: function(e) {
        if (e.key === "ArrowLeft") window.SpaceShooter.keys.left = true;
        if (e.key === "ArrowRight") window.SpaceShooter.keys.right = true;
        if (e.key === " ") window.SpaceShooter.keys.shoot = true;
    },
    
    keyUpHandler: function(e) {
        if (e.key === "ArrowLeft") window.SpaceShooter.keys.left = false;
        if (e.key === "ArrowRight") window.SpaceShooter.keys.right = false;
        if (e.key === " ") window.SpaceShooter.keys.shoot = false;
    },
    
    resizeHandler: function() {
        if (window.SpaceShooter.canvas) {
            window.SpaceShooter.canvas.width = window.innerWidth;
            window.SpaceShooter.canvas.height = window.innerHeight;
            if (window.SpaceShooter.player) {
                window.SpaceShooter.player.x = window.SpaceShooter.canvas.width / 2 - window.SpaceShooter.player.width / 2;
                window.SpaceShooter.player.y = window.SpaceShooter.canvas.height - window.SpaceShooter.player.height - 30;
            }
        }
    },
    
    // Cleanup function to stop game and remove listeners
    cleanup: function() {
        console.log("Cleaning up Space Shooter game");
        
        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear intervals
        if (this.bombInterval) {
            clearInterval(this.bombInterval);
            this.bombInterval = null;
        }
        
        if (this.powerUpInterval) {
            clearInterval(this.powerUpInterval);
            this.powerUpInterval = null;
        }
        
        // Remove event listeners
        document.removeEventListener("keydown", this.keyDownHandler);
        document.removeEventListener("keyup", this.keyUpHandler);
        window.removeEventListener("resize", this.resizeHandler);
        
        // Hide return button if it exists
        if (this.returnButton) {
            this.returnButton.style.display = 'none';
        }
        
        // Reset all game variables
        this.keys = { left: false, right: false, shoot: false };
    }
};

// Expose functions needed by mainpage.js
window.initializeSpaceShooter = function() {
    window.SpaceShooter.init();
};

window.cleanupSpaceShooter = function() {
    window.SpaceShooter.cleanup();
}; 