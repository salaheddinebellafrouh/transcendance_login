document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        window.location.href = '/index.html';
        return;
    }

    // Clear the saved view when first logging in
    // This ensures we start at the home page on a fresh login
    const isNewLogin = sessionStorage.getItem('freshLogin');
    if (isNewLogin) {
        localStorage.removeItem('currentView');
        sessionStorage.removeItem('freshLogin');
    }

    // Fetch user data
    const API_URL = 'http://localhost:8000';
    
    // IMPORTANT: Restore the view from localStorage
    const currentView = localStorage.getItem('currentView');
    
    // Fetch user data FIRST, then initialize the view
    fetch(`${API_URL}/api/user`, {
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
        },
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return response.json();
    })
    .then(userData => {
        // Store user data first
        updateUserProfile(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // THEN initialize the view - this ensures we have user data before showing any view
        if (currentView) {
            if (currentView === 'game') {
                // If we're restoring to the game view, make sure to initialize the game
                startGame();
            } else {
                showView(currentView);
            }
        } else {
            // Default to home view if nothing is stored
            showView('home');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        localStorage.removeItem('jwt');
        window.location.href = '/index.html';
    });
    
    // Set up settings button
    document.querySelector('.settings i').addEventListener('click', () => {
        // Show settings or logout prompt
        if (confirm('Do you want to logout?')) {
            logout();
        }
    });

    // Initialize SPA navigation
    initSpaNavigation();
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
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    // Show the requested view
    document.getElementById(`${viewName}View`).style.display = 'block';
    
    // Save current view to localStorage
    localStorage.setItem('currentView', viewName);
    
    // Special handling for different views
    if (viewName === 'game') {
        // Initialize game
        loadGameResources(() => {
            if (window.Game) {
                // Reset game state first
                window.resetGame();
                
                // Then initialize
                window.initializeGame();
            }
        });
    } 
    else if (viewName === 'tournament') {
        // Initialize tournament
        loadTournamentResources(() => {
            // Force tournament setup after loading resources
            if (window.setupTournamentDirectly) {
                window.setupTournamentDirectly();
            }
        });
    }
    
    // Update active state in navigation if needed
    document.querySelectorAll('.spa-link').forEach(link => {
        if (link.classList.contains('active')) {
            link.classList.remove('active');
        }
        
        const linkPath = link.getAttribute('data-path');
        if (linkPath && linkPath.replace('/', '') === viewName) {
            link.classList.add('active');
        }
    });
}

function updateUserProfile(userData) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (userData.name) {
        userName.textContent = userData.name;
    }
    
    if (userData.image_url) {
        userAvatar.src = userData.image_url;
    }
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
    // We need to make sure user data is available
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Set default player names, preferring loaded userData over DOM element
    localStorage.setItem('currentMatch', JSON.stringify({
        player1: userData.name || document.getElementById('userName').textContent || 'Player 1',
        player2: 'Player 2'
    }));
    
    // Switch to game view
    showView('game');
    
    // Load game resources if not already loaded
    loadGameResources(() => {
        // Make sure everything is clean before initializing
        if (window.Game) {
            window.cleanupGame();
            window.resetGame();
        }
        
        // Give the DOM a moment to render before initializing the game
        setTimeout(() => {
            window.initializeGame();
        }, 100);
    });
}

// Helper function to load game resources
function loadGameResources(callback) {
    // Check if game resources are already loaded
    if (window.Game && document.getElementById('gameCssLoaded')) {
        callback();
        return;
    }
    
    // Load game CSS
    if (!document.getElementById('gameCssLoaded')) {
        const gameCss = document.createElement('link');
        gameCss.id = 'gameCssLoaded';
        gameCss.rel = 'stylesheet';
        gameCss.href = '../game/game.css';
        document.head.appendChild(gameCss);
    }
    
    // Load game JS
    if (!window.Game) {
        const gameScript = document.createElement('script');
        gameScript.src = '../game/game.js';
        gameScript.onload = callback;
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

// Update the loadTournamentResources function to ensure handlers are attached
function loadTournamentResources(callback) {
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
            window.tournamentInitialized = true;
            
            // Call the callback after a short delay to ensure everything is initialized
            setTimeout(() => {
                if (typeof callback === 'function') {
                    callback();
                }
                
                // Directly call tournament setup
                if (typeof window.setupTournamentDirectly === 'function') {
                    window.setupTournamentDirectly();
                    
                    // Ensure restart button has handler
                    const restartButton = document.querySelector('.restart-tournament-btn');
                    if (restartButton) {
                        restartButton.onclick = function() {
                            // Reset tournament state
                            if (typeof window.resetTournament === 'function') {
                                window.resetTournament();
                            } else {
                                // Fallback reset
                                localStorage.removeItem('tournamentState');
                                document.querySelector('.setup-section').classList.remove('hide');
                                document.querySelector('.tournament-container').classList.remove('show');
                                document.querySelector('.player-inputs').classList.remove('show');
                            }
                        };
                    }
                }
            }, 100);
        };
        document.body.appendChild(tournamentScript);
    } else {
        // Scripts already loaded, just call the callback
        if (typeof callback === 'function') {
            callback();
        }
        
        // Make sure tournament is set up
        if (typeof window.setupTournamentDirectly === 'function') {
            window.setupTournamentDirectly();
        }
    }
}

// Expose showView function to window so it can be called from game.js
window.showView = showView; 