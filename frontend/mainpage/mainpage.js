document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    
    // Check authentication
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        window.location.href = '/index.html';
        return;
    }
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Update profile display
    updateUserProfile(userData);
    
    // Initialize SPA navigation
    initSpaNavigation();
    
    // Check if there's a saved view to restore after refresh
    const savedView = localStorage.getItem('currentView');
    console.log(`Saved view found: ${savedView}`);
    
    if (savedView) {
        if (savedView === 'game') {
            // Handle game restoration - check if it's tournament or regular game
            if (localStorage.getItem('currentMatch')) {
                console.log('Restoring tournament game...');
                startTournamentGame();
            } else {
                console.log('Restoring regular game...');
                startGame();
            }
        } else if (savedView === 'tournament') {
            // Special case for tournament with active match
            if (localStorage.getItem('currentMatch') && !localStorage.getItem('matchResult')) {
                // No result means we were in the middle of a game
                console.log('Restoring tournament game in progress...');
                startTournamentGame();
            } else {
                console.log('Restoring tournament view...');
                showView('tournament');
            }
        } else {
            // For other views, just restore normally
            console.log(`Restoring view: ${savedView}`);
            showView(savedView);
        }
    } else {
        // Default to home view
        console.log('No saved view, defaulting to home');
        showView('home');
    }
});

// Simple SPA navigation
function initSpaNavigation() {
    // Add click handlers to all spa-link elements
    document.querySelectorAll('.spa-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-path');
            if (path) {
                if (path === '/game') {
                    startGame(); // Call startGame function directly for game view
                } else {
                    showView(path.replace('/', ''));
                }
            }
        });
    });
}

function showView(viewName) {
    console.log(`Switching to view: ${viewName}`);
    
    // Clean up previous view if needed
    if (viewName !== 'game' && window.GameEngine) {
        window.GameEngine.cleanup();
    }
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    // Show the requested view
    const viewElement = document.getElementById(`${viewName}View`);
    if (!viewElement) {
        console.error(`View element not found: ${viewName}View`);
        return;
    }
    
    viewElement.style.display = 'block';
    
    // Save current view to localStorage for all views, including game
    localStorage.setItem('currentView', viewName);
    
    // Handle specific view initialization
    if (viewName === 'game') {
        // Already being handled by the specific start functions
    } else if (viewName === 'tournament') {
        loadTournamentResources();
    }
    
    // Update active state in navigation
    document.querySelectorAll('.spa-link').forEach(link => {
        link.classList.remove('active');
        const linkPath = link.getAttribute('data-path');
        if (linkPath && linkPath.replace('/', '') === viewName) {
            link.classList.add('active');
        }
    });
}

function updateUserProfile(userData) {
    console.log("Updating user profile with data:", userData);
    
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    // Update username display
    if (userName && userData.name) {
        userName.textContent = userData.name;
        console.log("Set user name to:", userData.name);
    } else if (userName) {
        // Get user info from backend if we don't have it
        fetchUserInfo();
    }
    
    // Update avatar if available
    if (userAvatar && userData.image_url) {
        userAvatar.src = userData.image_url;
    }
}

function fetchUserInfo() {
    console.log("Fetching user info from backend");
    
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;
    
    fetch('http://localhost:8000/api/user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return response.json();
    })
    .then(data => {
        console.log("Received user data from backend:", data);
        
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify(data));
        
        // Update UI with fetched data
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = data.name;
            console.log("Set user name to:", data.name);
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && data.image_url) {
            userAvatar.src = data.image_url;
        }
    })
    .catch(error => {
        console.error("Error fetching user data:", error);
    });
}

function logout() {
    const API_URL = 'http://localhost:8000';
    
    fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
    })
    .then(() => {
        // Clean up ALL localStorage items related to the app
        localStorage.removeItem('jwt');
        localStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        
        // Important - clear view and game state
        localStorage.removeItem('currentView');
        localStorage.removeItem('currentMatch');
        localStorage.removeItem('matchResult');
        
        // Clear any session storage items too
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = '/index.html';
    })
    .catch(error => {
        console.error('Error during logout:', error);
        
        // Force logout even if the server request fails
        // Clean up ALL localStorage items related to the app
        localStorage.removeItem('jwt');
        localStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        
        // Important - clear view and game state
        localStorage.removeItem('currentView');
        localStorage.removeItem('currentMatch');
        localStorage.removeItem('matchResult');
        
        // Clear any session storage items too
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = '/index.html';
    });
}

function startGame() {
    console.log("Starting regular game");
    
    // Show game view immediately
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    const gameView = document.getElementById('gameView');
    if (gameView) {
        gameView.style.display = 'block';
    } else {
        console.error("Game view not found!");
        return;
    }
    
    // Save view state specifically for regular games
    localStorage.setItem('currentView', 'game');
    localStorage.removeItem('currentMatch'); // Ensure we're in regular game mode
    
    // Load game resources
    loadGameResources(() => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const player1 = userData.name || document.getElementById('userName')?.textContent || 'Player 1';
        
        console.log("Initializing game with player:", player1);
        
        // Initialize the game
        if (window.GameEngine) {
            window.GameEngine.init({
                player1: player1,
                player2: 'Player 2',
                winningScore: 5,
                onGameOver: function(winner, score1, score2) {
                    console.log(`Game over: ${winner} wins ${score1}-${score2}`);
                    
                    if (window.GameEngine.elements.finishButton) {
                        window.GameEngine.elements.finishButton.textContent = 'Return to Home';
                        window.GameEngine.elements.finishButton.style.display = 'flex';
                        
                        // Set up finish button handler
                        if (window.GameEngine.handlers.finish) {
                            window.GameEngine.elements.finishButton.removeEventListener('click', window.GameEngine.handlers.finish);
                        }
                        
                        window.GameEngine.handlers.finish = function() {
                            window.GameEngine.cleanup();
                            showView('home');
                        };
                        
                        window.GameEngine.elements.finishButton.addEventListener('click', window.GameEngine.handlers.finish);
                    }
                }
            });
        } else {
            console.error("GameEngine not found after loading resources!");
        }
    });
}

// Helper function to load game resources - this needs to be fixed
function loadGameResources(callback) {
    console.log("Loading game resources");
    
    // Check if game resources are already loaded - UPDATED CHECK
    if (window.GameEngine && document.getElementById('gameCssLoaded')) {
        console.log("Game resources already loaded");
        callback();
        return;
    }
    
    // Load game CSS
    if (!document.getElementById('gameCssLoaded')) {
        console.log("Loading game CSS");
        const gameCss = document.createElement('link');
        gameCss.id = 'gameCssLoaded';
        gameCss.rel = 'stylesheet';
        gameCss.href = '../game/game.css';
        document.head.appendChild(gameCss);
    }
    
    // Load game JS - UPDATED CHECK
    if (!window.GameEngine) {
        console.log("Loading game JS");
        const gameScript = document.createElement('script');
        gameScript.src = '../game/game.js';
        gameScript.onload = function() {
            console.log("Game script loaded");
            setTimeout(callback, 100); // Give it time to initialize
        };
        document.body.appendChild(gameScript);
    } else {
        callback();
    }
}

function joinTournament() {
    // Switch to tournament view
    showView('tournament');
    
    // Load tournament resources if not already loaded
    loadTournamentResources();
}

function createTournament() {
    // Switch to tournament view
    showView('tournament');
    
    // Load tournament resources if not already loaded
    loadTournamentResources();
}

// Helper function to load tournament resources
function loadTournamentResources(callback) {
    console.log("Loading tournament resources");
    
    // Load tournament CSS
    if (!document.getElementById('tournamentCssLoaded')) {
        const tournamentCss = document.createElement('link');
        tournamentCss.id = 'tournamentCssLoaded';
        tournamentCss.rel = 'stylesheet';
        tournamentCss.href = '../tournament/tournament.css';
        document.head.appendChild(tournamentCss);
    }
    
    // Load tournament JS
    if (!window.tournamentInitialized) {
        const tournamentScript = document.createElement('script');
        tournamentScript.src = '../tournament/tournament.js';
        tournamentScript.onload = function() {
            console.log("Tournament script loaded");
            window.tournamentInitialized = true;
            
            // Initialize tournament after a short delay to ensure DOM is ready
            setTimeout(() => {
                if (typeof window.setupTournamentDirectly === 'function') {
                    console.log("Initializing tournament directly");
                    window.setupTournamentDirectly();
                }
                
                if (typeof callback === 'function') {
                    callback();
                }
            }, 100);
        };
        document.body.appendChild(tournamentScript);
    } else {
        // Scripts already loaded, just call the callback
        if (typeof window.setupTournamentDirectly === 'function') {
            window.setupTournamentDirectly();
        }
        
        if (typeof callback === 'function') {
            setTimeout(callback, 10);
        }
    }
}

// Add this function to handle tournament games specifically
function startTournamentGame() {
    console.log("Starting tournament game");
    
    // Get the current match data
    const currentMatchStr = localStorage.getItem('currentMatch');
    if (!currentMatchStr) {
        console.error("No current match data found");
        showView('tournament');
        return;
    }
    
    const currentMatch = JSON.parse(currentMatchStr);
    console.log("Tournament match data:", currentMatch);
    
    // Show game view
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    const gameView = document.getElementById('gameView');
    if (!gameView) {
        console.error("Game view not found");
        return;
    }
    
    gameView.style.display = 'block';
    
    // Reset player name elements in the DOM before game init
    const player1El = document.getElementById('player1Name');
    const player2El = document.getElementById('player2Name');
    
    if (player1El) {
        player1El.innerHTML = '<i class="fas fa-user"></i><span>Player 1</span>';
    }
    if (player2El) {
        player2El.innerHTML = '<i class="fas fa-user"></i><span>Player 2</span>';
    }
    
    // Load game resources and initialize the game
    loadGameResources(() => {
        if (!window.GameEngine) {
            console.error("GameEngine not available");
            return;
        }
        
        // Make sure we have the most updated player names
        console.log(`Initializing tournament game: ${currentMatch.player1} vs ${currentMatch.player2}`);
        
        window.GameEngine.init({
            player1: currentMatch.player1,
            player2: currentMatch.player2,
            winningScore: 3, // Tournament games are shorter
            onGameOver: function(winner, score1, score2) {
                console.log(`Tournament match completed: ${winner} wins ${score1}-${score2}`);
                
                // Save result
                localStorage.setItem('matchResult', JSON.stringify({
                    winner: winner,
                    score: `${score1}-${score2}`
                }));
                
                // Update finish button
                if (window.GameEngine.elements.finishButton) {
                    window.GameEngine.elements.finishButton.textContent = 'Return to Tournament';
                    window.GameEngine.elements.finishButton.style.display = 'flex';
                    
                    // Set up finish button handler
                    if (window.GameEngine.handlers.finish) {
                        window.GameEngine.elements.finishButton.removeEventListener('click', window.GameEngine.handlers.finish);
                    }
                    
                    window.GameEngine.handlers.finish = function() {
                        window.GameEngine.cleanup();
                        showView('tournament');
                    };
                    
                    window.GameEngine.elements.finishButton.addEventListener('click', window.GameEngine.handlers.finish);
                }
            }
        });
    });
}

// Export this function for tournament.js to use
window.startTournamentGame = startTournamentGame;

// Export the fetchUserInfo function for tournament use
window.fetchUserInfo = fetchUserInfo; 