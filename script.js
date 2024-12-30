const REACTION_COUNT = 10;

class ReactionTimeGame {
    constructor() {
        this.squares = document.querySelectorAll('.game-square');
        this.gameStatus = document.getElementById('game-status');
        this.participantForm = document.getElementById('participant-form');
        this.startButton = document.querySelector('#button-status');

        this.attempts = 0;
        this.reactionTimes = [];
        this.startTime = 0;
        this.clickEnabled = true; // Prevent rapid clicks

        this.bindEvents();
    }

    bindEvents() {
        this.squares.forEach(square => {
            square.addEventListener('click', this.handleSquareClick.bind(this));
        });

        this.participantForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    handleFormSubmit(e) {
        e.preventDefault();

        // Validate form fields
        const age = document.getElementById('age').value;
        const gender = document.querySelector('input[name="gender"]:checked');
        const gamer = document.querySelector('input[name="gamer"]:checked');

        if (age.trim() === '' || !gender || !gamer) {
            alert('Please complete all form fields');
            return;
        }

        // Reset game state
        this.attempts = 0;
        this.reactionTimes = [];
        this.gameStatus.textContent = '';

        if (this.startButton.textContent === 'Restart Game') {
            // Deactivate all squares
            this.squares.forEach(square => square.classList.remove('active'));
        }

        // Start countdown
        this.startCountdown();
    }

    startCountdown() {
        let countdown = 4;
        this.gameStatus.textContent = 'Click the green square as quickly as possible!';

        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.startButton.textContent = `Starting in ${countdown}`;
            } else if (countdown === 0) {
                this.startButton.textContent = 'Restart Game';
            } else {
                clearInterval(interval);
                this.gameStatus.textContent = 'Click the green square as quickly as possible!';
                this.startNextRound();
            }
        }, 1000);
    }

    startNextRound() {
        // Deactivate all squares
        this.squares.forEach(square => square.classList.remove('active'));

        // Randomly select a square to activate
        const randomIndex = Math.floor(Math.random() * this.squares.length);
        this.squares[randomIndex].classList.add('active');

        // Start reaction time tracking
        this.startTime = performance.now();
        this.clickEnabled = true;
    }

    handleSquareClick(e) {
        const clickedSquare = e.target;

        // Only process click if the square is active and clicks are enabled
        if (!this.clickEnabled || !clickedSquare.classList.contains('active')) return;

        this.clickEnabled = false; // Disable further clicks until next round

        // Calculate reaction time
        const endTime = performance.now();
        const reactionTime = endTime - this.startTime;

        // Record reaction time
        this.reactionTimes.push(reactionTime);
        this.attempts++;

        // Remove active state
        clickedSquare.classList.remove('active');

        // Check if game is complete
        if (this.attempts >= REACTION_COUNT) {
            this.finishGame();
            return;
        }

        // Update status
        this.gameStatus.textContent = `Reaction Time: ${reactionTime.toFixed(2)} ms`;

        // Start next round
        setTimeout(() => this.startNextRound(), 500);
    }

    async finishGame() {
        // Calculate average reaction time
        const averageReactionTime = this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length;

        // Prepare participant data
        const age = document.getElementById('age').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const gamer = document.querySelector('input[name="gamer"]:checked').value;

        const participantData = {
            isGamer: gamer === 'yes', // Convert to boolean
            age: parseInt(age, 10),
            reactionTime: averageReactionTime.toFixed(2),
            gender: gender,
        };

        try {
            // Send data to the backend
            const response = await fetch('https://rextiondatagathback.azurewebsites.net/reaction-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(participantData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Data saved successfully:', result);

                // Display final game status
                this.gameStatus.innerHTML = `Game Complete! <br> Average Reaction Time: ${averageReactionTime.toFixed(2)} ms.`;
            } else {
                const errorData = await response.json();
                console.error('Error saving data:', errorData);

                this.gameStatus.innerHTML = `Game Complete! <br> Average Reaction Time: ${averageReactionTime.toFixed(2)} ms.`;
            }
        } catch (error) {
            console.error('Network error:', error);
            this.gameStatus.innerHTML = `Game Complete! <br> Average Reaction Time: ${averageReactionTime.toFixed(2)} ms.`;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReactionTimeGame();
});
