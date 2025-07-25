// Tower Guardian - Main Entry Point
import { Game } from './Game.js';

console.log('🏰 Tower Guardian Starting...');

// Get canvas and setup basic configuration
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const loading = document.getElementById('loading');

if (!canvas) {
  throw new Error('Could not find canvas element');
}

let game: Game;

// Setup canvas size and resolution
function setupCanvas() {
  const container = document.getElementById('gameContainer')!;
  const containerRect = container.getBoundingClientRect();
  
  // Calculate game area size (maintaining 16:9 aspect ratio)
  const targetAspectRatio = 16 / 9;
  let gameWidth = containerRect.width * 0.95; // Leave some margin
  let gameHeight = gameWidth / targetAspectRatio;
  
  // If height is too big, scale by height instead
  if (gameHeight > containerRect.height * 0.95) {
    gameHeight = containerRect.height * 0.95;
    gameWidth = gameHeight * targetAspectRatio;
  }
  
  // Set canvas size
  canvas.width = gameWidth;
  canvas.height = gameHeight;
  canvas.style.width = `${gameWidth}px`;
  canvas.style.height = `${gameHeight}px`;
  
  console.log(`Canvas setup: ${gameWidth}x${gameHeight}`);
}

// Initialize the game
function init() {
  setupCanvas();
  
  // Create and start the game engine
  game = new Game(canvas);
  game.start();
  
  // Hide loading screen
  if (loading) {
    loading.classList.add('hidden');
  }
  
  console.log('🎮 Game initialized successfully');
}

// Handle window resize
window.addEventListener('resize', () => {
  setupCanvas();
  if (game) {
    game.handleResize();
  }
});

// Handle page visibility changes to pause/resume game
document.addEventListener('visibilitychange', () => {
  if (game) {
    if (document.hidden) {
      console.log('🔇 Page hidden - consider pausing game');
      // Game continues running for now, but we could pause here
    } else {
      console.log('🔊 Page visible - game active');
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (game) {
    game.stop();
  }
});

// Start the game
init();