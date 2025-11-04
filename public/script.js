/* public/script.js */

// === Game State and Elements ===
let score = 0;
let cross = true; // Flag to prevent multiple scores on one obstacle

// Element selection based on your index.html structure
const dino = document.querySelector(".dino");
// HTML uses class="obstacle obstacleAni" — selector was wrong ('.obstacle1')
const obstacle = document.querySelector(".obstacle");
const gameOver = document.querySelector(".gameOver");
const scoreCount = document.getElementById("scoreCount");

// === Audio Setup
// Audio files: if they are missing the play promise will reject; we catch errors.
const audio = new Audio("music.mp3");
const audioJump = new Audio("gameover.mp3");

// Delay Initial music play slightly
setTimeout(() => {
  // CSS visibility values are lowercase 'visible' / 'hidden'
  if (!gameOver || gameOver.style.visibility !== "visible") {
    audio.play().catch((err) => {
      // Autoplay may be blocked by browser until user interaction
      console.warn("Background music play was blocked:", err);
    });
  }
}, 1000);

// === WebSocket (Socket.IO) Setup ===
const socket = io("http://localhost:3000");

// Listener for JUMP command from the ESP32 (via the Node.js server)
socket.on("game_jump", () => {
  console.log("JUMP SIGNAL RECEIVED FROM SERVER - Executing Character jump");
  jumpCharacter();
});

// --- Input Controls: keyboard and on-screen button ---
// Keyboard: ArrowUp triggers a jump
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp" || e.key === "ArrowUp") {
    // Prevent page scrolling on some browsers
    e.preventDefault();
    jumpCharacter();
  }
  // Optional: allow Space to jump too
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    jumpCharacter();
  }
});

// On-screen jump button for touch devices
const jumpBtn = document.getElementById("jumpBtn");
if (jumpBtn) {
  jumpBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    jumpCharacter();
  });
  // touchstart for faster response on mobile
  jumpBtn.addEventListener("touchstart", (ev) => {
    ev.preventDefault();
    jumpCharacter();
  });
}

// === Game Logic Functions ===

function jumpCharacter() {
  if (!dino.classList.contains("animateDino")) {
    dino.classList.add("animateDino");
    // Play jump/game sound; guard against promise rejection
    audioJump
      .play()
      .catch((err) => console.warn("Jump sound play blocked or missing:", err));

    // Remove animation class after 1 second (MUST match the duration set in your style.css)
    setTimeout(() => {
      dino.classList.remove("animateDino");
    }, 1000);
  }
}

function updateScore() {
  // Keep the display simple and consistent with HTML
  scoreCount.innerHTML = "Your Score: " + score;
}

// === Game Loop for Collision Detection and Scoring ===
let gameLoopInterval = setInterval(gameLoop, 10);

function gameLoop() {
  // 1. Get Dino Position (X position is fixed, Y position is simplified)
  const dinoX = parseInt(
    window.getComputedStyle(dino, null).getPropertyValue("left")
  );
  // The base position is 0 (ground).
  let dinoBaseY = 0;

  // Check if the dino is currently at a high vertical position (JUMPING)
  // We can check the presence of the class AND the time elapsed in the animation (optional but safer).
  const isJumping = dino.classList.contains("animateDino");

  // 2. Get Obstacle Position (X is the critical value for collision/scoring)
  // NOTE: If obstacle 'left' returns 'vw' (e.g., "50vw") parseInt will fail,
  // resulting in 0. We'll use getBoundingClientRect for reliability.
  // If obstacle is not present, skip collision/score logic (prevents runtime errors)
  if (!obstacle) {
    console.warn("No obstacle element found. Skipping collision detection.");
    return;
  }

  const obstacleRect = obstacle.getBoundingClientRect();
  const dinoRect = dino.getBoundingClientRect();

  const obstacleX = obstacleRect.left;
  const obstacleY = obstacleRect.bottom;

  // We can use the Dino's Bounding Rect bottom property as a reliable Y-position.
  // When jumping, the bottom value will be lower (closer to the top of the screen).
  const dinoY_bottom = dinoRect.bottom;

  // Collision check using bounding boxes (AABB)
  const collision =
    dinoRect.left < obstacleRect.right &&
    dinoRect.right > obstacleRect.left &&
    dinoRect.top < obstacleRect.bottom &&
    dinoRect.bottom > obstacleRect.top;

  // Collision Detection
  if (collision) {
    // Game Over Logic
    console.log("GAME OVER: Collision Detected!");
    if (gameOver) gameOver.style.visibility = "visible";
    // CSS class is 'obstacleAni' (not 'obstacleAnim') — remove it so the obstacle stops animating
    if (obstacle) obstacle.classList.remove("obstacleAni");
    audio.pause();
    // Optionally play a gameover sound if you have one (audioJump currently points to gameover.mp3)
    audioJump.play().catch(() => {});

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
