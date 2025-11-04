/* public/script.js */

// === Game State and Elements ===
let score = 0;
let cross = true;

// === Element selection ===
const dino = document.querySelector(".dino");
const obstacle = document.querySelector(".obstacle");
const gameOver = document.querySelector(".gameOver");
const scoreCount = document.getElementById("scoreCount");

// === Audio Setup ===
const audio = new Audio("music.mp3"); // background music
const audioOver = new Audio("gameover.mp3"); // game over sound

audio.loop = true;
audio.volume = 0.5;
audioOver.volume = 1.0;

// === Start background music automatically ===
// === Start background music only after first key press ===
window.addEventListener("load", () => {
  document.addEventListener(
    "keydown",
    () => {
      if (audio.paused) {
        audio.play()
          .then(() => console.log("🎵 Background music started!"))
          .catch(err => console.warn("Music play blocked:", err));
      }
    },
    { once: true } // only trigger once
  );
});

// === WebSocket (Socket.IO) Setup ===
const socket = io("http://localhost:3000");

// Listener for JUMP command from ESP32 via server
socket.on("game_jump", () => {
  console.log("JUMP SIGNAL RECEIVED FROM SERVER - Executing Character jump");
  jumpCharacter();
});

// === Input Controls ===
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp" || e.code === "Space") {
    e.preventDefault();
    jumpCharacter();
  }
});

const jumpBtn = document.getElementById("jumpBtn");
if (jumpBtn) {
  ["click", "touchstart"].forEach((eventType) =>
    jumpBtn.addEventListener(eventType, (ev) => {
      ev.preventDefault();
      jumpCharacter();
    })
  );
}

// === Game Logic ===
function jumpCharacter() {
  if (!dino.classList.contains("animateDino")) {
    dino.classList.add("animateDino");

    setTimeout(() => {
      dino.classList.remove("animateDino");
    }, 1800); // match your CSS jump duration
  }
}

function updateScore() {
  scoreCount.innerHTML = "Your Score: " + score;
}

// === Game Loop ===
let gameLoopInterval = setInterval(gameLoop, 10);

function gameLoop() {
  if (!obstacle) return;

  const obstacleRect = obstacle.getBoundingClientRect();
  const dinoRect = dino.getBoundingClientRect();

  const collision =
    dinoRect.left < obstacleRect.right &&
    dinoRect.right > obstacleRect.left &&
    dinoRect.top < obstacleRect.bottom &&
    dinoRect.bottom > obstacleRect.top;

  if (collision) {
    console.log("GAME OVER: Collision Detected!");
    if (gameOver) gameOver.style.visibility = "visible";
    if (obstacle) obstacle.classList.remove("obstacleAni");

    // Stop background music
    audio.pause();
    audio.currentTime = 0;

    // Play game over sound once
    audioOver.currentTime = 0;
    audioOver.play().catch((err) => {
      console.warn("Game over sound play blocked:", err);
    });

    clearInterval(gameLoopInterval);
    return;
  }

  // === Scoring ===
  if (obstacleRect.right < dinoRect.left && cross) {
    score++;
    updateScore();
    cross = false;

    setTimeout(() => (cross = true), 1000);
  }
}
