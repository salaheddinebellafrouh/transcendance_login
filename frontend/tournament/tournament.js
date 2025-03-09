// Tournament System - Clean Implementation
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
        
        // Update UI based on current state
        this.updateUI();
        
        // Check for match results
        this.checkMatchResults();
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
        
        // Create remaining player inputs
        for (let i = 1; i < count; i++) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'player-input';
            inputDiv.innerHTML = `<input type="text" placeholder="Player ${i+1} Name" class="player-name-input">`;
            container.appendChild(inputDiv);
        }
    },
    
    // Generate tournament structure
    generateTournament: function() {
        // Validate all player names are filled in
        if (!this.validatePlayerNames()) {
            return;
        }
        
        // Update progress step
        this.setActiveStep(2);
        
        // Create tournament bracket structure
        this.createBracketStructure();
        
        // Show tournament bracket
        this.showBracket();
        
        // Save state
        this.saveState();
    },
    
    // Validate player names
    validatePlayerNames: function() {
        const inputs = document.querySelectorAll('.player-name-input');
        const errorMessage = document.querySelector('.error-message');
        
        // Get all player names
        this.state.players = [];
        let allValid = true;
        
        inputs.forEach(input => {
            const name = input.value.trim();
            if (name === '') {
                allValid = false;
            } else {
                this.state.players.push(name);
            }
        });
        
        // Show/hide error message
        if (!allValid) {
            errorMessage.classList.add('show');
            return false;
        } else {
            errorMessage.classList.remove('show');
            return true;
        }
    },
    
    // Create bracket structure
    createBracketStructure: function() {
        // Get logged in user
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const loggedInUserName = userData.name || document.getElementById('userName').textContent || 'Player 1';
        
        // Make sure logged in user is first
        const players = [...this.state.players];
        const userIndex = players.findIndex(name => name === loggedInUserName);
        if (userIndex > 0) {
            players.splice(userIndex, 1);
            players.unshift(loggedInUserName);
        }
        
        // Randomize other players
        const otherPlayers = players.slice(1);
        this.shuffleArray(otherPlayers);
        this.state.players = [loggedInUserName, ...otherPlayers];
        
        // Reset tournament data
        this.state.rounds = [];
        this.state.currentMatchId = null;
        this.state.isComplete = false;
        
        // Create first round
        const firstRound = [];
        for (let i = 0; i < this.state.players.length; i += 2) {
            const match = {
                id: `r0m${i/2}`,
                player1: this.state.players[i],
                player2: i + 1 < this.state.players.length ? this.state.players[i + 1] : null,
                winner: i + 1 >= this.state.players.length ? this.state.players[i] : null,
                score: i + 1 >= this.state.players.length ? 'W-0' : null,
                isComplete: i + 1 >= this.state.players.length
            };
            firstRound.push(match);
        }
        this.state.rounds.push(firstRound);
        
        // Create subsequent rounds
        let roundIndex = 1;
        let matchesInRound = Math.ceil(firstRound.length / 2);
        
        while (matchesInRound > 0) {
            const round = [];
            for (let i = 0; i < matchesInRound; i++) {
                round.push({
                    id: `r${roundIndex}m${i}`,
                    player1: null,
                    player2: null,
                    winner: null,
                    score: null,
                    isComplete: false
                });
            }
            this.state.rounds.push(round);
            matchesInRound = Math.ceil(matchesInRound / 2);
            roundIndex++;
        }
        
        // Advance players with byes
        this.advanceWinners();
    },
    
    // Show the tournament bracket
    showBracket: function() {
        // Hide setup, show bracket
        document.querySelector('.setup-section').classList.add('hide');
        document.querySelector('.tournament-container').classList.add('show');
        
        // Render the bracket
        this.renderBracket();
        
        // Update start button
        this.updateStartButton();
    },
    
    // Render the tournament bracket
    renderBracket: function() {
        const bracketContainer = document.getElementById('tournament-bracket');
        if (!bracketContainer) return;
        
        // Clear existing content
        bracketContainer.innerHTML = '';
        
        // Create container for rounds
        const roundsContainer = document.createElement('div');
        roundsContainer.className = 'rounds';
        
        // Get user data for highlighting
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const loggedInUserName = userData.name || document.getElementById('userName').textContent;
        
        // Create each round
        this.state.rounds.forEach((round, roundIndex) => {
            const roundEl = document.createElement('div');
            roundEl.className = 'round';
            
            // Add round label
            const roundLabel = document.createElement('div');
            roundLabel.className = 'round-label';
            roundLabel.textContent = roundIndex === this.state.rounds.length - 1 ? 'Final' : 
                                    roundIndex === this.state.rounds.length - 2 ? 'Semi-Finals' : 
                                    `Round ${roundIndex + 1}`;
            roundEl.appendChild(roundLabel);
            
            // Create each match in this round
            round.forEach(match => {
                const matchEl = document.createElement('div');
                matchEl.className = 'match';
                matchEl.dataset.id = match.id;
                
                // Player 1 section
                const player1El = document.createElement('div');
                player1El.className = 'player-slot';
                if (match.player1) {
                    player1El.classList.add('filled');
                    if (match.winner === match.player1) {
                        player1El.classList.add('winner');
                    }
                    if (match.player1 === loggedInUserName) {
                        player1El.classList.add('current-user');
                    }
                }
                player1El.textContent = match.player1 || 'TBD';
                matchEl.appendChild(player1El);
                
                // VS separator
                const vsEl = document.createElement('div');
                vsEl.className = 'vs';
                vsEl.innerHTML = match.score ? `<span>${match.score}</span>` : 'vs';
                matchEl.appendChild(vsEl);
                
                // Player 2 section
                const player2El = document.createElement('div');
                player2El.className = 'player-slot';
                if (match.player2) {
                    player2El.classList.add('filled');
                    if (match.winner === match.player2) {
                        player2El.classList.add('winner');
                    }
                    if (match.player2 === loggedInUserName) {
                        player2El.classList.add('current-user');
                    }
                }
                player2El.textContent = match.player2 || 'TBD';
                matchEl.appendChild(player2El);
                
                // Highlight current match
                if (match.id === this.state.currentMatchId) {
                    matchEl.classList.add('current');
                }
                
                // Add match to round
                roundEl.appendChild(matchEl);
            });
            
            // Add round to container
            roundsContainer.appendChild(roundEl);
        });
        
        // Add rounds to bracket
        bracketContainer.appendChild(roundsContainer);
        
        // Check if tournament is complete
        this.checkTournamentComplete();
    },
    
    // Start the next pending match
    startNextMatch: function() {
        const nextMatch = this.findNextPendingMatch();
        if (!nextMatch) return;
        
        // Store current match ID
        this.state.currentMatchId = nextMatch.id;
        this.saveState();
        
        // Set up match data for the game
        localStorage.setItem('currentMatch', JSON.stringify({
            id: nextMatch.id,
            player1: nextMatch.player1,
            player2: nextMatch.player2,
            isTournament: true,
            winningScore: 3
        }));
        
        // Navigate to game view
        window.location.href = '#game';
        if (typeof window.showView === 'function') {
            window.showView('game');
        }
    },
    
    // Find the next pending match
    findNextPendingMatch: function() {
        // Get logged in user
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const loggedInUserName = userData.name || document.getElementById('userName').textContent;
        
        // First priority: user's matches
        for (const round of this.state.rounds) {
            for (const match of round) {
                if (!match.isComplete && match.player1 && match.player2) {
                    if (match.player1 === loggedInUserName || match.player2 === loggedInUserName) {
                        return match;
                    }
                }
            }
        }
        
        // Second priority: any pending match
        for (const round of this.state.rounds) {
            for (const match of round) {
                if (!match.isComplete && match.player1 && match.player2) {
                    return match;
                }
            }
        }
        
        return null;
    },
    
    // Check for match results
    checkMatchResults: function() {
        const resultStr = localStorage.getItem('matchResult');
        if (!resultStr) return;
        
        try {
            const result = JSON.parse(resultStr);
            const matchId = this.state.currentMatchId;
            
            if (!matchId) {
                localStorage.removeItem('matchResult');
                return;
            }
            
            // Find the match and update it
            const match = this.findMatchById(matchId);
            if (match) {
                match.winner = result.winner;
                match.score = result.score;
                match.isComplete = true;
                
                // Advance winners to next rounds
                this.advanceWinners();
                
                // Save state
                this.saveState();
                
                // Render bracket
                this.renderBracket();
                
                // Reset current match id
                this.state.currentMatchId = null;
                
                // Clean up
                localStorage.removeItem('matchResult');
            }
            
        } catch (e) {
            console.error('Error processing match result:', e);
            localStorage.removeItem('matchResult');
        }
    },
    
    // Find match by ID
    findMatchById: function(id) {
        for (const round of this.state.rounds) {
            for (const match of round) {
                if (match.id === id) {
                    return match;
                }
            }
        }
        return null;
    },
    
    // Advance winners to next rounds
    advanceWinners: function() {
        for (let roundIndex = 0; roundIndex < this.state.rounds.length - 1; roundIndex++) {
            const round = this.state.rounds[roundIndex];
            const nextRound = this.state.rounds[roundIndex + 1];
            
            round.forEach((match, matchIndex) => {
                if (match.winner) {
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    if (nextRound[nextMatchIndex]) {
                        if (matchIndex % 2 === 0) {
                            nextRound[nextMatchIndex].player1 = match.winner;
                        } else {
                            nextRound[nextMatchIndex].player2 = match.winner;
                        }
                    }
                }
            });
        }
    },
    
    // Check if tournament is complete
    checkTournamentComplete: function() {
        if (this.state.rounds.length === 0) return false;
        
        const finalRound = this.state.rounds[this.state.rounds.length - 1];
        if (finalRound.length === 0) return false;
        
        const finalMatch = finalRound[0];
        if (finalMatch.winner) {
            this.state.isComplete = true;
            this.announceWinner(finalMatch.winner);
            return true;
        }
        
        return false;
    },
    
    // Announce winner
    announceWinner: function(winner) {
        // Remove any existing announcement
        const existingAnnouncement = document.querySelector('.winner-announcement');
        if (existingAnnouncement) {
            existingAnnouncement.remove();
        }
        
        // Create announcement
        const tournamentContainer = document.querySelector('.tournament-container');
        const announcement = document.createElement('div');
        announcement.className = 'winner-announcement';
        announcement.innerHTML = `
            <div class="winner-trophy"><i class="fas fa-trophy"></i></div>
            <h2>Tournament Champion</h2>
            <div class="winner-name">${winner}</div>
            <p>Congratulations!</p>
            <button class="new-tournament-btn">Start New Tournament</button>
        `;
        
        tournamentContainer.appendChild(announcement);
        
        // Add event listener to button
        document.querySelector('.new-tournament-btn').addEventListener('click', () => this.resetTournament());
    },
    
    // Update visibility of start button
    updateStartButton: function() {
        const startButton = document.querySelector('.start-button');
        if (!startButton) return;
        
        const nextMatch = this.findNextPendingMatch();
        if (nextMatch && !this.state.isComplete) {
            startButton.style.display = 'flex';
            startButton.innerHTML = `
                <i class="fas fa-play"></i>
                ${nextMatch.player1} vs ${nextMatch.player2}
                <i class="fas fa-chevron-right"></i>
            `;
        } else {
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
            
            // Update progress step
            this.setActiveStep(this.state.isComplete ? 3 : 2);
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
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

// Initialize tournament when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    Tournament.init();
});

// Make Tournament globally accessible
window.Tournament = Tournament; 