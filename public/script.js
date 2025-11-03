/* public/script.js */

// === Game State and Elements ===
let score = 0;
let cross = true; // Flag to prevent multiple scores on one obstacle

// Element selection based on your index.html structure
const dino = document.querySelector('.dino');
const obstacle = document.querySelector('.obstacle1');
const gameOver = document.querySelector('.gameOver');
const scoreCount = document.getElementById('scoreCount');

// === Audio Setup
const audio = new Audio('music.mp3');
const audioJump = new Audio('gameover.mp3');

// Delay Initial music play slightly
setTimeout(() => {
    if (gameOver.style.visibility !== 'Visible') {
        audio.play();
    }
}, 1000);

// === WebSocket (Socket.IO) Setup ===
const socket = io('http://localhost:3000');

// Listener for JUMP command from the ESP32 (via the Node.js server)
socket.on('game_jump', () => {
    console.log('JUMP SIGNAL RECEIVED FROM SERVER - Executing Character jump');
    jumpCharacter();
});


// === Game Logic Functions ===

function jumpCharacter() {
    if (!dino.classList.contains('animateDino')) {
        dino.classList.add('animateDino');
        audioJump.play(); // Play jump sound

        // Remove animation class after 1 second (MUST match the duration set in your style.css)
        setTimeout(() => {
            dino.classList.remove('animateDino');
        }, 1000);
    }
}

function updateScore() {
    scoreCount.innerHTML = 'Your Score: $' + score + ';';
}

// === Game Loop for Collision Detection and Scoring ===
let gameLoopInterval = setInterval(gameLoop, 10);

function gameLoop() {
    // 1. Get Dino Position (X position is fixed, Y position is simplified)
    const dinoX = parseInt(window.getComputedStyle(dino, null).getPropertyValue('left'));
    // The base position is 0 (ground).
    let dinoBaseY = 0; 
    
    // Check if the dino is currently at a high vertical position (JUMPING)
    // We can check the presence of the class AND the time elapsed in the animation (optional but safer).
    const isJumping = dino.classList.contains('animateDino');

    // 2. Get Obstacle Position (X is the critical value for collision/scoring)
    // NOTE: If obstacle 'left' returns 'vw' (e.g., "50vw") parseInt will fail, 
    // resulting in 0. We'll use getBoundingClientRect for reliability.
    const obstacleRect = obstacle.getBoundingClientRect();
    const dinoRect = dino.getBoundingClientRect();

    const obstacleX = obstacleRect.left;
    const obstacleY = obstacleRect.bottom;

    // We can use the Dino's Bounding Rect bottom property as a reliable Y-position.
    // When jumping, the bottom value will be lower (closer to the top of the screen).
    const dinoY_bottom = dinoRect.bottom;
    
    // Collision check using bounding boxes (AABB)
    const collision = (
        dinoRect.left < obstacleRect.right &&
        dinoRect.right > obstacleRect.left &&
        dinoRect.top < obstacleRect.bottom &&
        dinoRect.bottom > obstacleRect.top
    );
    
    // Collision Detection
    if (collision) {
        // Game Over Logic
        console.log("GAME OVER: Collision Detected!");
        gameOver.style.visibility = 'Visible';
        obstacle.classList.remove('obstacleAnim');
        audio.pause();
        
        clearInterval(gameLoopInterval);
    }
    
    // Scoring Logic
    // Check if the obstacle has passed the fixed dino position (DinoX)
    // We check the right edge of the obstacle against the left edge of the dino.
    if (obstacleRect.right < dinoRect.left && cross) { 
        score++;
        updateScore();
        cross = false; // Prevent scoring again immediately

        // Allow scoring again after a safe amount of time
        setTimeout(() => {
            cross = true;
        }, 1000);
    }
}