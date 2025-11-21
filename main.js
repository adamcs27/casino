import { Game } from './src/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game; // Expose for debugging
    game.start();
});
