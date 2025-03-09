// Tournament System
const Tournament = {
    // Tournament state
    state: {
        players: [],
        rounds: [],
        currentMatchId: null,
        isComplete: false
    },
    
    // Initialize tournament system
    init: function() {
        console.log("Initializing tournament system");
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Try to restore state if exists
        this.loadState();
        
        // Check for match results
        this.checkMatchResults();
        
        // Update UI based on current state
        this.updateUI();
    },
    
    // Attach all event listeners
    attachEventListeners: function() {
        // Player count buttons
        const countButtons = document.querySelectorAll('#tournamentView .count-button');
        countButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Activate this button
                countButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Create player inputs
                const playerCount = parseInt(button.dataset.count);
                this.createPlayerInputs(playerCount);
                
                // Show player inputs section
                document.querySelector('.player-inputs').classList.add('show');
                
                // Update progress indicator
                this.setActiveStep(1);
            });
        });
        
        // Generate bracket button
        const generateButton = document.querySelector('.generate-bracket-button');
        if (generateButton) {
            generateButton.addEventListener('click', () => this.generateTournament());
        }
        
        // Start match button
        const startButton = document.querySelector('.start-button');
        if (startButton) {
            startButton.addEventListener('click', () => this.startNextMatch());
        }
        
        // Restart tournament button
        const restartButton = document.querySelector('.restart-tournament-btn');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.resetTournament());
        }
    },
    
    // Create input fields for players
    createPlayerInputs: function(count) {
        const container = document.getElementById('players-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Get logged in user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const loggedInUserName = userData.name || document.getElementById('userName').textContent || 'Player 1';
        
        // First input is always for the logged-in user
        const userInputDiv = document.createElement('div');
        userInputDiv.className = 'player-input user-player';
        userInputDiv.innerHTML = `
            <input type="text" value="${loggedInUserName}" class="player-name-input" readonly>
            <span class="user-badge">You</span>
        `;
        container.appendChild(userInputDiv);
        
        // Create remaining player inputs with AI players by default
        for (let i = 1; i < count; i++) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'player-input';
            inputDiv.innerHTML = `<input type="text" value="AI Player ${i}" class="player-name-input">`;
            container.appendChild(inputDiv);
        }
    },
    
    // Generate tournament from player inputs
    generateTournament: function() {
        // Get player names from inputs
        const inputs = document.querySelectorAll('.player-name-input');
        const players = [];
        let allFilled = true;
        
        inputs.forEach(input => {
            const name = input.value.trim();
            if (!name) {
                allFilled = false;
            } else {
                players.push(name);
            }
        });
        
        // Check that all inputs are filled
        if (!allFilled) {
            document.querySelector('.error-message').classList.add('show');
            return;
        } else {
            document.querySelector('.error-message').classList.remove('show');
        }
        
        // Randomize player order (except the first player who is always the user)
        const firstPlayer = players[0];
        const otherPlayers = this.shuffleArray(players.slice(1));
        this.state.players = [firstPlayer, ...otherPlayers];
        
        // Generate rounds
        this.generateRounds();
        
        // Show tournament bracket
        this.showBracket();
        
        // Hide setup section, show tournament bracket
        document.querySelector('.setup-section').classList.add('hide');
        document.querySelector('.tournament-container').classList.add('show');
        
        // Show start button
        document.querySelector('.start-button').style.display = 'block';
        
        // Update progress steps
        this.setActiveStep(2);
        
        // Save tournament state
        this.saveState();
    },
    
    // Generate tournament rounds
    generateRounds: function() {
        this.state.rounds = [];
        
        // Create first round matches
        const firstRound = {
            name: 'Round 1',
            matches: []
        };
        
        // Create matches based on player count
        for (let i = 0; i < this.state.players.length; i += 2) {
            if (i + 1 < this.state.players.length) {
                firstRound.matches.push({
                    id: `match-${this.state.rounds.length}-${firstRound.matches.length}`,
                    player1: this.state.players[i],
                    player2: this.state.players[i + 1],
                    winner: null,
                    score: null
                });
            } else {
                // Handle odd number of players with a "bye"
                firstRound.matches.push({
                    id: `match-${this.state.rounds.length}-${firstRound.matches.length}`,
                    player1: this.state.players[i],
                    player2: 'BYE',
                    winner: this.state.players[i],
                    score: 'BYE'
                });
            }
        }
        
        this.state.rounds.push(firstRound);
    },
    
    // Show the bracket in the UI
    showBracket: function() {
        const bracket = document.getElementById('tournament-bracket');
        if (!bracket) return;
        
        bracket.innerHTML = '';
        
        // Create rounds
        this.state.rounds.forEach((round, roundIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round';
            roundDiv.innerHTML = `<h3 class="round-title">${round.name}</h3>`;
            
            // Create matches in this round
            round.matches.forEach(match => {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'match-pair';
                matchDiv.dataset.id = match.id;
                
                // Create match header
                const matchHeader = document.createElement('div');
                matchHeader.className = 'match-header';
                matchHeader.textContent = `Match`;
                
                // Create player1 element
                const player1Div = document.createElement('div');
                player1Div.className = `player ${match.winner === match.player1 ? 'winner' : ''}`;
                
                const player1Name = document.createElement('span');
                player1Name.className = 'player-name';
                player1Name.textContent = match.player1;
                
                const player1Score = document.createElement('span');
                player1Score.className = 'score';
                player1Score.textContent = match.score ? match.score.split('-')[0] : '0';
                
                player1Div.appendChild(player1Name);
                player1Div.appendChild(player1Score);
                
                // Create player2 element
                const player2Div = document.createElement('div');
                player2Div.className = `player ${match.winner === match.player2 ? 'winner' : ''}`;
                
                const player2Name = document.createElement('span');
                player2Name.className = 'player-name';
                player2Name.textContent = match.player2;
                
                const player2Score = document.createElement('span');
                player2Score.className = 'score';
                player2Score.textContent = match.score ? match.score.split('-')[1] : '0';
                
                player2Div.appendChild(player2Name);
                player2Div.appendChild(player2Score);
                
                // Create match status
                const matchStatus = document.createElement('div');
                matchStatus.className = 'match-status';
                matchStatus.textContent = match.winner ? 'Completed' : 'Pending';
                
                // Assemble match
                matchDiv.appendChild(matchHeader);
                matchDiv.appendChild(player1Div);
                matchDiv.appendChild(player2Div);
                matchDiv.appendChild(matchStatus);
                
                // Add to round
                roundDiv.appendChild(matchDiv);
            });
            
            // Add round to bracket
            bracket.appendChild(roundDiv);
        });
        
        // Show tournament container
        document.querySelector('.tournament-container').classList.add('show');
        
        // If tournament is complete, show winner
        if (this.state.isComplete) {
            this.showWinner();
        }
    },
    
    // Find and start the next pending match
    startNextMatch: function() {
        // Find the first pending match
        let pendingMatch = null;
        
        for (const round of this.state.rounds) {
            for (const match of round.matches) {
                if (!match.winner && match.player2 !== 'BYE') {
                    pendingMatch = match;
                    break;
                }
            }
            if (pendingMatch) break;
        }
        
        if (pendingMatch) {
            // Store the match ID to identify it when we return
            this.state.currentMatchId = pendingMatch.id;
            this.saveState();
            
            // Save current match data for the game
            localStorage.setItem('currentMatch', JSON.stringify({
                id: pendingMatch.id,
                player1: pendingMatch.player1,
                player2: pendingMatch.player2,
                isTournament: true
            }));
            
            // Navigate to game view
            if (typeof window.showView === 'function') {
                window.showView('game');
            } else {
                window.location.href = '/game';
            }
        } else if (!this.state.isComplete && this.getWinner()) {
            // All matches complete, show winner
            this.state.isComplete = true;
            this.saveState();
            this.showWinner();
        } else {
            // No pending matches, and no winner - something went wrong
            console.error("No pending matches found");
        }
    },
    
    // Check for match results and update
    checkMatchResults: function() {
        const matchResult = localStorage.getItem('matchResult');
        if (matchResult) {
            try {
                const result = JSON.parse(matchResult);
                
                // Find the match
                let match = null;
                let round = null;
                
                for (const r of this.state.rounds) {
                    for (const m of r.matches) {
                        if (m.id === result.matchId || m.id === this.state.currentMatchId) {
                            match = m;
                            round = r;
                            break;
                        }
                    }
                    if (match) break;
                }
                
                if (match) {
                    // Update match with result
                    match.winner = result.winner;
                    match.score = result.score;
                    
                    // Create next round if needed
                    this.advanceTournament(round);
                    
                    // Update UI
                    this.showBracket();
                    
                    // Save state
                    this.saveState();
                }
                
                // Clear result
                localStorage.removeItem('matchResult');
                
            } catch (e) {
                console.error("Error processing match result:", e);
            }
        }
    },
    
    // Advance tournament - create next round if current is complete
    advanceTournament: function(currentRound) {
        // Check if all matches in the current round are complete
        const isRoundComplete = currentRound.matches.every(match => !!match.winner);
        
        if (!isRoundComplete) return;
        
        // Find the current round index
        const roundIndex = this.state.rounds.findIndex(r => r === currentRound);
        
        // Get winners from current round
        const winners = currentRound.matches.map(match => match.winner);
        
        // If only one winner, tournament is complete
        if (winners.length === 1) {
            this.state.isComplete = true;
            return;
        }
        
        // Create next round
        const nextRound = {
            name: `Round ${roundIndex + 2}`,
            matches: []
        };
        
        // Create matches for next round
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                nextRound.matches.push({
                    id: `match-${roundIndex + 1}-${nextRound.matches.length}`,
                    player1: winners[i],
                    player2: winners[i + 1],
                    winner: null,
                    score: null
                });
            } else {
                // Handle odd number of players with a "bye"
                nextRound.matches.push({
                    id: `match-${roundIndex + 1}-${nextRound.matches.length}`,
                    player1: winners[i],
                    player2: 'BYE',
                    winner: winners[i],
                    score: 'BYE'
                });
            }
        }
        
        // Add next round
        this.state.rounds.push(nextRound);
        
        // Check if we need to advance again (in case of BYEs)
        if (nextRound.matches.length === 1 && nextRound.matches[0].player2 === 'BYE') {
            this.advanceTournament(nextRound);
        }
    },
    
    // Get the tournament winner
    getWinner: function() {
        // The winner is the winner of the last match in the last round
        if (this.state.rounds.length > 0) {
            const lastRound = this.state.rounds[this.state.rounds.length - 1];
            if (lastRound.matches.length > 0) {
                const lastMatch = lastRound.matches[lastRound.matches.length - 1];
                return lastMatch.winner;
            }
        }
        return null;
    },
    
    // Show the winner announcement
    showWinner: function() {
        const winner = this.getWinner();
        if (!winner) return;
        
        // Create or update winner announcement
        let announcement = document.querySelector('.winner-announcement');
        if (!announcement) {
            announcement = document.createElement('div');
            announcement.className = 'winner-announcement';
            document.querySelector('.tournament-container').appendChild(announcement);
        }
        
        // Update content
        announcement.innerHTML = `
            <div class="trophy-icon"><i class="fas fa-trophy"></i></div>
            <h2>Tournament Champion</h2>
            <div class="winner-name">${winner}</div>
            <button class="new-tournament-btn">
                <i class="fas fa-sitemap"></i>
                Start New Tournament
            </button>
        `;
        
        // Add event listener to new tournament button
        const newTournamentBtn = announcement.querySelector('.new-tournament-btn');
        if (newTournamentBtn) {
            newTournamentBtn.addEventListener('click', () => this.resetTournament());
        }
        
        // Hide start button
        const startButton = document.querySelector('.start-button');
        if (startButton) {
            startButton.style.display = 'none';
        }
    },
    
    // Reset tournament
    resetTournament: function() {
        // Clear tournament state
        this.state = {
            players: [],
            rounds: [],
            currentMatchId: null,
            isComplete: false
        };
        
        // Clear localStorage
        localStorage.removeItem('tournamentState');
        localStorage.removeItem('matchResult');
        localStorage.removeItem('currentMatch');
        
        // Reset UI
        document.querySelector('.setup-section').classList.remove('hide');
        document.querySelector('.tournament-container').classList.remove('show');
        document.querySelector('.player-inputs').classList.remove('show');
        
        // Reset player count buttons
        document.querySelectorAll('.count-button').forEach(btn => btn.classList.remove('active'));
        
        // Clear player inputs
        const playersContainer = document.getElementById('players-container');
        if (playersContainer) {
            playersContainer.innerHTML = '';
        }
        
        // Remove winner announcement
        const announcement = document.querySelector('.winner-announcement');
        if (announcement) announcement.remove();
        
        // Reset progress steps
        this.setActiveStep(0);
        
        // Make sure tournament view is visible
        document.querySelector('#tournamentView').style.display = 'block';
    },
    
    // Save state to localStorage
    saveState: function() {
        localStorage.setItem('tournamentState', JSON.stringify(this.state));
    },
    
    // Load state from localStorage
    loadState: function() {
        const savedState = localStorage.getItem('tournamentState');
        if (savedState) {
            try {
                this.state = JSON.parse(savedState);
            } catch (e) {
                console.error('Error loading tournament state:', e);
            }
        }
    },
    
    // Update UI based on current state
    updateUI: function() {
        if (this.state.rounds.length > 0) {
            // We have tournament data, show the bracket
            this.showBracket();
            
            // Hide setup section
            document.querySelector('.setup-section').classList.add('hide');
            
            // Update progress step
            this.setActiveStep(this.state.isComplete ? 3 : 2);
            
            // Show/hide start button based on state
            const startButton = document.querySelector('.start-button');
            if (startButton) {
                startButton.style.display = this.state.isComplete ? 'none' : 'block';
            }
        }
    },
    
    // Set active step in progress indicator
    setActiveStep: function(stepIndex) {
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index <= stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    },
    
    // Shuffle array (Fisher-Yates algorithm)
    shuffleArray: function(array) {
        const arrayCopy = [...array];
        for (let i = arrayCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
        }
        return arrayCopy;
    }
};

// Make Tournament globally accessible
window.Tournament = Tournament;

// Expose functions needed by mainpage.js
window.setupTournamentDirectly = function() {
    Tournament.init();
};

window.resetTournament = function() {
    Tournament.resetTournament();
}; 