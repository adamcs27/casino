import * as THREE from 'three';

export class CasinoGames {
    constructor() {
        this.money = 100;
        this.isGameOpen = false;
        this.currentGame = null;

        this.ui = {
            overlay: document.getElementById('game-overlay'),
            content: document.getElementById('game-content'),
            closeBtn: document.getElementById('close-game'),
            moneyDisplay: document.getElementById('money-display')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.ui.closeBtn.addEventListener('click', () => this.closeGame());
    }

    openGame(type) {
        this.isGameOpen = true;
        this.currentGame = type;
        this.ui.overlay.classList.remove('hidden');
        document.exitPointerLock();

        this.renderGameUI(type);
    }

    closeGame() {
        this.isGameOpen = false;
        this.currentGame = null;
        this.ui.overlay.classList.add('hidden');
        this.ui.content.innerHTML = '<button id="close-game">Close</button>';

        // Re-bind close button since we wiped innerHTML
        this.ui.closeBtn = document.getElementById('close-game');
        this.ui.closeBtn.addEventListener('click', () => this.closeGame());
    }

    updateMoney(amount) {
        this.money += amount;
        // Update main display
        const display = document.getElementById('money-display');
        if (display) {
            display.innerText = `Money: $${this.money}`;
        }

        // Show/hide broke notification
        const brokeNotification = document.getElementById('broke-notification');
        if (brokeNotification) {
            if (this.money <= 0) {
                brokeNotification.classList.add('show');
            } else {
                brokeNotification.classList.remove('show');
            }
        }
    }

    renderGameUI(type) {
        // Clear previous content but keep close button
        const closeBtn = this.ui.closeBtn;
        this.ui.content.innerHTML = '';
        this.ui.content.appendChild(closeBtn);

        const title = document.createElement('h2');
        title.innerText = type.toUpperCase();
        title.style.color = '#fff';
        this.ui.content.appendChild(title);

        if (type === 'slots') {
            this.renderSlots();
        } else if (type === 'blackjack') {
            this.renderBlackjack();
        } else if (type === 'snake') {
            this.renderSnake();
        }
    }

    renderSlots() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '20px';
        container.style.margin = '20px';

        const reels = [0, 0, 0].map(() => {
            const reel = document.createElement('div');
            reel.style.width = '60px';
            reel.style.height = '80px';
            reel.style.background = '#fff';
            reel.style.color = '#000';
            reel.style.fontSize = '40px';
            reel.style.display = 'flex';
            reel.style.justifyContent = 'center';
            reel.style.alignItems = 'center';
            reel.innerText = '7';
            container.appendChild(reel);
            return reel;
        });

        this.ui.content.appendChild(container);

        const messageDiv = document.createElement('div');
        messageDiv.style.height = '30px';
        messageDiv.style.color = '#0f0';
        messageDiv.style.fontSize = '24px';
        messageDiv.style.marginBottom = '10px';
        this.ui.content.appendChild(messageDiv);

        const spinBtn = document.createElement('button');
        spinBtn.innerText = 'SPIN ($10)';
        spinBtn.style.padding = '10px 20px';
        spinBtn.style.fontSize = '20px';
        spinBtn.onclick = () => {
            if (this.money < 10) return;
            this.updateMoney(-10);
            messageDiv.innerText = '';

            // Simple animation
            let iterations = 0;
            const interval = setInterval(() => {
                reels.forEach(r => r.innerText = Math.floor(Math.random() * 5));
                iterations++;
                if (iterations > 10) {
                    clearInterval(interval);
                    // Result
                    const results = reels.map(r => parseInt(r.innerText));
                    if (results[0] === results[1] && results[1] === results[2]) {
                        this.updateMoney(100);
                        messageDiv.innerText = 'YOU WIN! +$100';
                        messageDiv.style.color = '#0f0';
                    } else {
                        messageDiv.innerText = 'Try Again';
                        messageDiv.style.color = '#f00';
                    }
                }
            }, 100);
        };
        this.ui.content.appendChild(spinBtn);
    }

    renderBlackjack() {
        const container = document.createElement('div');
        container.style.textAlign = 'center';

        const dealerDiv = document.createElement('div');
        dealerDiv.innerHTML = '<h3>Dealer</h3><div id="dealer-hand"></div>';
        container.appendChild(dealerDiv);

        const playerDiv = document.createElement('div');
        playerDiv.innerHTML = '<h3>You</h3><div id="player-hand"></div>';
        container.appendChild(playerDiv);

        const messageDiv = document.createElement('div');
        messageDiv.id = 'bj-message';
        messageDiv.style.height = '30px';
        messageDiv.style.fontSize = '20px';
        messageDiv.style.margin = '10px 0';
        container.appendChild(messageDiv);

        const controls = document.createElement('div');
        controls.style.marginTop = '20px';

        const hitBtn = document.createElement('button');
        hitBtn.innerText = 'HIT';
        hitBtn.style.marginRight = '10px';

        const standBtn = document.createElement('button');
        standBtn.innerText = 'STAND';
        standBtn.style.marginRight = '10px';

        const resetBtn = document.createElement('button');
        resetBtn.innerText = 'PLAY AGAIN';
        resetBtn.style.display = 'none';

        controls.appendChild(hitBtn);
        controls.appendChild(standBtn);
        controls.appendChild(resetBtn);
        container.appendChild(controls);

        this.ui.content.appendChild(container);

        // Game Logic
        let deck, playerHand, dealerHand, gameOver;

        const startRound = () => {
            if (this.money < 50) {
                messageDiv.innerText = 'Not enough money ($50 required)';
                messageDiv.style.color = '#f00';
                hitBtn.disabled = true;
                standBtn.disabled = true;
                return;
            }
            this.updateMoney(-50);
            deck = this.createDeck();
            playerHand = [deck.pop(), deck.pop()];
            dealerHand = [deck.pop(), deck.pop()];
            gameOver = false;
            messageDiv.innerText = '';
            hitBtn.disabled = false;
            standBtn.disabled = false;
            resetBtn.style.display = 'none';
            hitBtn.style.display = 'inline-block';
            standBtn.style.display = 'inline-block';
            updateUI();
        };

        const updateUI = (showDealer = false) => {
            document.getElementById('player-hand').innerText = `${this.handValue(playerHand)} (${playerHand.join(', ')})`;
            if (showDealer) {
                document.getElementById('dealer-hand').innerText = `${this.handValue(dealerHand)} (${dealerHand.join(', ')})`;
            } else {
                document.getElementById('dealer-hand').innerText = `? (${dealerHand[0]}, ?)`;
            }
        };

        const endGame = (msg, color) => {
            gameOver = true;
            messageDiv.innerText = msg;
            messageDiv.style.color = color;
            hitBtn.style.display = 'none';
            standBtn.style.display = 'none';
            resetBtn.style.display = 'inline-block';
        };

        hitBtn.onclick = () => {
            if (gameOver) return;
            playerHand.push(deck.pop());
            updateUI();
            if (this.handValue(playerHand) > 21) {
                endGame('BUST! YOU LOSE', '#f00');
            }
        };

        standBtn.onclick = () => {
            if (gameOver) return;

            // Dealer AI
            while (this.handValue(dealerHand) < 17) {
                dealerHand.push(deck.pop());
            }

            updateUI(true);

            const pVal = this.handValue(playerHand);
            const dVal = this.handValue(dealerHand);

            if (dVal > 21 || pVal > dVal) {
                this.updateMoney(100); // Return bet + win
                endGame('YOU WIN! +$50', '#0f0');
            } else if (pVal === dVal) {
                this.updateMoney(50); // Return bet
                endGame('PUSH', '#ff0');
            } else {
                endGame('DEALER WINS', '#f00');
            }
        };

        resetBtn.onclick = () => {
            startRound();
        };

        startRound();
    }

    createDeck() {
        const suits = ['H', 'D', 'C', 'S'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (let s of suits) {
            for (let r of ranks) {
                deck.push(r + s);
            }
        }
        return deck.sort(() => Math.random() - 0.5);
    }

    handValue(hand) {
        let val = 0;
        let aces = 0;
        for (let card of hand) {
            let rank = card.slice(0, -1);
            if (['J', 'Q', 'K'].includes(rank)) val += 10;
            else if (rank === 'A') { val += 11; aces++; }
            else val += parseInt(rank);
        }
        while (val > 21 && aces > 0) {
            val -= 10;
            aces--;
        }
        return val;
    }

    renderSnake() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        canvas.style.background = '#000';
        canvas.style.border = '2px solid #0f0';
        this.ui.content.appendChild(canvas);

        const messageDiv = document.createElement('div');
        messageDiv.style.height = '30px';
        messageDiv.style.color = '#f00';
        messageDiv.style.fontSize = '20px';
        messageDiv.style.marginTop = '10px';
        this.ui.content.appendChild(messageDiv);

        const resetBtn = document.createElement('button');
        resetBtn.innerText = 'PLAY AGAIN';
        resetBtn.style.display = 'none';
        resetBtn.style.marginTop = '10px';
        this.ui.content.appendChild(resetBtn);

        const ctx = canvas.getContext('2d');
        const gridSize = 20;
        let snake, apple, dx, dy, score, gameLoop;

        const startSnake = () => {
            snake = [{ x: 10, y: 10 }];
            apple = { x: 15, y: 10 };
            dx = 1;
            dy = 0;
            score = 0;
            messageDiv.innerText = '';
            resetBtn.style.display = 'none';

            if (gameLoop) clearInterval(gameLoop);

            gameLoop = setInterval(() => {
                if (!this.isGameOpen || this.currentGame !== 'snake') {
                    clearInterval(gameLoop);
                    return;
                }

                // Move
                const head = { x: snake[0].x + dx, y: snake[0].y + dy };
                snake.unshift(head);

                // Eat
                if (head.x === apple.x && head.y === apple.y) {
                    score++;
                    this.updateMoney(250);
                    apple = {
                        x: Math.floor(Math.random() * (canvas.width / gridSize)),
                        y: Math.floor(Math.random() * (canvas.height / gridSize))
                    };
                } else {
                    snake.pop();
                }

                // Die
                if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize) {
                    clearInterval(gameLoop);
                    messageDiv.innerText = `GAME OVER! Score: ${score}`;
                    resetBtn.style.display = 'inline-block';
                }

                // Draw
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#0f0';
                snake.forEach(part => ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2));

                ctx.fillStyle = '#f00';
                ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize - 2, gridSize - 2);

            }, 100);
        };

        resetBtn.onclick = () => startSnake();

        // Controls
        const handleKey = (e) => {
            if (!this.isGameOpen || this.currentGame !== 'snake') {
                window.removeEventListener('keydown', handleKey);
                return;
            }
            switch (e.key) {
                case 'ArrowUp': if (dy !== 1) { dx = 0; dy = -1; } break;
                case 'ArrowDown': if (dy !== -1) { dx = 0; dy = 1; } break;
                case 'ArrowLeft': if (dx !== 1) { dx = -1; dy = 0; } break;
                case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
            }
        };
        window.addEventListener('keydown', handleKey);

        startSnake();
    }
}
