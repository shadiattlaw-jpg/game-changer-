const player = document.getElementById("player");
const obstaclesWrap = document.getElementById("obstacles");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");

const obstaclePool = [
  { emoji: "☕", label: "spiteful coffee", width: 60, height: 60 },
  { emoji: "🖨️", label: "angry printer", width: 76, height: 70 },
  { emoji: "📅", label: "surprise meeting", width: 68, height: 68 },
  { emoji: "📎", label: "mega paperclip", width: 52, height: 52 },
  { emoji: "📣", label: "urgent email", width: 62, height: 62 },
];

let playerY = 0;
let velocity = 0;
let gravity = 0.85;
let jumpStrength = 15;
let running = false;
let score = 0;
let best = Number(localStorage.getItem("corporate-escape-best") || 0);
let speed = 6;
let frameId = 0;
let spawnTimer = 0;
let obstacleId = 0;
let obstacles = [];
let lastTimestamp = 0;

bestEl.textContent = String(best);

function randomObstacle() {
  return obstaclePool[Math.floor(Math.random() * obstaclePool.length)];
}

function spawnObstacle() {
  const type = randomObstacle();
  const element = document.createElement("div");
  element.className = "obstacle";
  element.textContent = type.emoji;
  element.dataset.label = type.label;
  element.style.width = `${type.width}px`;
  element.style.height = `${type.height}px`;
  const obstacle = {
    id: obstacleId++,
    x: gameArea.clientWidth + type.width,
    width: type.width,
    height: type.height,
    passed: false,
    element,
  };
  element.style.left = `${obstacle.x}px`;
  obstaclesWrap.appendChild(element);
  obstacles.push(obstacle);
}

function jump() {
  if (!running) {
    startGame();
    return;
  }

  if (playerY === 0) {
    velocity = jumpStrength;
    player.classList.add("jumping");
  }
}

function updatePlayer() {
  velocity -= gravity;
  playerY = Math.max(0, playerY + velocity);
  if (playerY === 0) {
    velocity = 0;
    player.classList.remove("jumping");
  }
  player.style.bottom = `${110 + playerY}px`;
}

function updateObstacles(delta) {
  const playerLeft = player.offsetLeft;
  const playerRect = {
    left: playerLeft,
    right: playerLeft + player.offsetWidth - 8,
    bottom: 110 + playerY,
    top: 110 + playerY + player.offsetHeight - 8,
  };

  obstacles = obstacles.filter((obstacle) => {
    obstacle.x -= speed * delta;
    obstacle.element.style.left = `${obstacle.x}px`;

    if (!obstacle.passed && obstacle.x + obstacle.width < playerRect.left) {
      obstacle.passed = true;
      score += 1;
      scoreEl.textContent = String(score);
      speed = 6 + score * 0.18;
    }

    const obstacleRect = {
      left: obstacle.x,
      right: obstacle.x + obstacle.width,
      bottom: 110,
      top: 110 + obstacle.height,
    };

    if (
      playerRect.left < obstacleRect.right &&
      playerRect.right > obstacleRect.left &&
      playerRect.bottom < obstacleRect.top &&
      playerRect.top > obstacleRect.bottom
    ) {
      gameOver();
      return false;
    }

    if (obstacle.x < -obstacle.width - 40) {
      obstacle.element.remove();
      return false;
    }

    return true;
  });
}

function gameLoop(timestamp) {
  if (!running) {
    return;
  }

  const delta = Math.min((timestamp - lastTimestamp) / 16.67, 2);
  lastTimestamp = timestamp;

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(40, 92 - score * 1.4) + Math.random() * 18;
  }

  updatePlayer();
  updateObstacles(delta);
  frameId = requestAnimationFrame(gameLoop);
}

function resetObstacles() {
  for (const obstacle of obstacles) {
    obstacle.element.remove();
  }
  obstacles = [];
}

function startGame() {
  running = true;
  score = 0;
  speed = 6;
  playerY = 0;
  velocity = 0;
  scoreEl.textContent = "0";
  player.style.bottom = "110px";
  overlay.classList.add("hidden");
  resetObstacles();
  spawnTimer = 55;
  lastTimestamp = performance.now();
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  running = false;
  cancelAnimationFrame(frameId);
  gameArea.classList.remove("shake");
  void gameArea.offsetWidth;
  gameArea.classList.add("shake");

  if (score > best) {
    best = score;
    localStorage.setItem("corporate-escape-best", String(best));
    bestEl.textContent = String(best);
  }

  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <p class="kicker">Performance review concluded</p>
    <h2>You were defeated by ${score === 0 ? "the first obstacle" : "office nonsense"}</h2>
    <p class="subtitle">Final score: ${score}. Click, tap, or smash space to begin your next extremely professional escape attempt.</p>
    <button id="startButton" type="button">Try Again</button>
  `;

  document.getElementById("startButton").addEventListener("click", startGame, { once: true });
}

startButton.addEventListener("click", startGame);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }
});

gameArea.addEventListener("pointerdown", jump);
