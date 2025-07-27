const player = document.getElementById("player");
const gameContainer = document.getElementById("gameContainer");
const scoreElement = document.getElementById("score");
const restartButton = document.getElementById("restartButton");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const musicButton = document.getElementById("musicButton");
const backgroundMusic = document.getElementById("backgroundMusic");
const jumpSound = document.getElementById("jumpSound");
const bestRecordElement = document.getElementById("bestRecord");
const sun = document.getElementById("sun");
const gameOverText = document.getElementById("gameOver");
const gameOverScreen = document.getElementById("gameOverScreen");
const randomTime = Math.random() * (60 - 30) + 30;

let countdown = 3;
let countdownInterval;
let isMusicOn = localStorage.getItem("isMusicOn") === "true" || false; 
let isJumping = false;
let isGameStart = false;
let isGameOver = false;
let score = 0;
let verifiedScore = 0;
let obstacles = [];
let gameInterval, obstacleInterval;
let obstacleSpeed = 7; 
let obstacleSpawnRate = 2000;
let speedIncreasing = true; 
let lastObstacleTime = 0; 
let minTimeBetweenObstacles = 1500;
let backgroundChanges = 0; 
let jumpCheckerActive = false; 
let bestRecord = getLocalStorage("bestRecord") || 0;

if (bestRecord && typeof bestRecord === 'string') {
  bestRecord = parseFloat(bestRecord.toString().trim());
}

window.onload = function() {
  setLocalStorage("bestRecord", parseFloat(bestRecord.toString().trim()), 365);

  if (bestRecord !== undefined && bestRecord !== null && bestRecord !== "") {
    scoreElement.innerText = `Score: ${score}, Best Record: ${bestRecord}`;
    bestRecordElement.innerHTML = `Your Best Record: ${bestRecord}`;
  } else {
    bestRecordElement.innerHTML = "Your Best Record: 0";
    scoreElement.innerText = `Score: ${score}, Best Record: 0`;
  }

  if (isMusicOn) {
    backgroundMusic.play();
    musicButton.src = "https://hop-run.vercel.app/assets/musicopen.png";
  } else {
    backgroundMusic.pause();
    musicButton.src = "https://hop-run.vercel.app/assets/musicoff.png";
  }

  const blackDiv = document.createElement('div');
  blackDiv.style.position = 'fixed';
  blackDiv.style.inset = '0';
  blackDiv.style.backgroundColor = 'black';
  blackDiv.style.display = 'flex';
  blackDiv.style.justifyContent = 'center';
  blackDiv.style.alignItems = 'center';
  blackDiv.style.opacity = '1';
  blackDiv.style.transition = 'opacity 2.5s ease';
  blackDiv.style.zIndex = '9999';
  blackDiv.style.overflow = 'hidden';

  const imgWrapper = document.createElement('div');
  imgWrapper.style.position = 'relative';
  imgWrapper.style.width = '90vw';
  imgWrapper.style.height = '90vh';

  const img = document.createElement('img');
  img.src = 'https://hop-run.vercel.app/assets/splash_screen.png';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.opacity = '0';
  img.style.transition = 'opacity 2.5s ease';
  img.style.display = 'block';

  const gameTitle = document.createElement('div');
  gameTitle.innerHTML = 'Hop & Run';
  gameTitle.style.position = 'absolute';
  gameTitle.style.right = '20px';
  gameTitle.style.bottom = '20px';
  gameTitle.style.fontFamily = 'Arial, sans-serif';
  gameTitle.style.fontWeight = '700';
  gameTitle.style.fontStyle = 'normal';
  gameTitle.style.lineHeight = 'normal';
  gameTitle.style.fontSize = '36px';
  gameTitle.style.color = 'rgb(255, 255, 255)';
  gameTitle.style.opacity = '0';
  gameTitle.style.transition = 'opacity 1.5s ease';

  imgWrapper.appendChild(img);
  imgWrapper.appendChild(gameTitle);
  blackDiv.appendChild(imgWrapper);
  document.body.appendChild(blackDiv);

  requestAnimationFrame(() => {
    img.style.opacity = '1';
  });

  setTimeout(() => {
    gameTitle.style.opacity = '1';
  }, 1500);

  let removed = false;

  function removeSplash() {
    if (removed) return;
    removed = true;
    img.style.opacity = '0';
    blackDiv.style.opacity = '0';
    gameTitle.style.opacity = '0';
    setTimeout(() => {
      blackDiv.remove();
      document.body.style.overflow = 'auto';
    }, 1500);
  }

  blackDiv.addEventListener('click', () => removeSplash());
  setTimeout(() => removeSplash(), 5000);
};

function setLocalStorage(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  const data = {
    value: cvalue,
    expires: d.getTime(), 
  };
  localStorage.setItem(cname, JSON.stringify(data));
}

function getLocalStorage(cname) {
  const item = localStorage.getItem(cname);
  if (!item) return "0"; 

  try {
    const data = JSON.parse(item);
    const now = Date.now();

    if (now > data.expires) {
      localStorage.removeItem(cname);
      return "0";
    }

    return data.value; 
  } catch (e) {
    return "0";
  }
}

function jump() {
  if (isJumping || isGameOver || !isGameStart) return;

  isJumping = true;
  player.classList.add("rotate");
  jumpSound.play();
  
  let jumpHeight = 0;
  const jumpInterval = setInterval(() => {
    if (jumpHeight < 170) {
      const newBottom = parseInt(player.style.bottom) + 8;
      player.style.bottom = `${newBottom}px`;
      jumpHeight += 8;
    } else {
      clearInterval(jumpInterval);
      const fallInterval = setInterval(() => {
        const currentBottom = parseInt(player.style.bottom);
        if (jumpHeight > 0 && currentBottom > 20) {
          player.style.bottom = `${currentBottom - 8}px`;
          jumpHeight -= 8;
        } else {
          clearInterval(fallInterval);
          isJumping = false;
          player.style.bottom = "20px";
          player.classList.remove("rotate");
          player.style.bottom = "20px";
        }
      }, 25);
    }
  }, 25);
}

function generateObstacle() {
  if (isGameOver || !isGameStart) return;
  const currentTime = Date.now();
  if (currentTime - lastObstacleTime < minTimeBetweenObstacles) {
    return;
  }
  const obstacle = document.createElement("div");
  obstacle.classList.add("obstacle");

  const randomWidth = Math.floor(Math.random() * 121) + 30;
  obstacle.style.width = `${randomWidth}px`;

  obstacle.style.right = "0px";

  gameContainer.appendChild(obstacle);
  obstacles.push(obstacle);

  lastObstacleTime = currentTime;
}

function moveObstacles() {
  obstacles.forEach((obstacle, index) => {
    let obstaclePosition = parseInt(obstacle.style.right);
    obstacle.style.right = `${obstaclePosition + obstacleSpeed}px`;

    const obstacleRect = obstacle.getBoundingClientRect();
    const gameContainerRect = gameContainer.getBoundingClientRect();

    if (obstacleRect.left <= gameContainerRect.left) {
      obstacle.remove();
      obstacles.splice(index, 1);

      score++;

      if (score > verifiedScore + 1) {
        score = verifiedScore + 1; 
      }

      verifiedScore = score;
      showScoreAnimation();

      if (score > bestRecord) {
        setLocalStorage("bestRecord", score, 365);
        bestRecord = score;
      }

      scoreElement.innerText = `Score: ${score}, Best Record: ${bestRecord || "0"}`;
      adjustSpeed();
    }

    const playerRect = player.getBoundingClientRect();
    if (
      playerRect.left < obstacleRect.right &&
      playerRect.right > obstacleRect.left &&
      playerRect.bottom > obstacleRect.top &&
      playerRect.top < obstacleRect.bottom
    ) {
      endGame();
    }
  });
}

function showScoreAnimation() {
  if (isGameOver || !isGameStart) return;

  const scoreAnimation = document.createElement("div");
  scoreAnimation.innerText = "+1";
  scoreAnimation.classList.add("score-animation");

  if (score > bestRecord) {
    scoreAnimation.style.color = "yellow"; 
  }

  const player = document.getElementById("player");
  const playerRect = player.getBoundingClientRect();
  scoreAnimation.style.position = "absolute";
  scoreAnimation.style.left = `${playerRect.left + playerRect.width / 2}px`;
  scoreAnimation.style.top = `${playerRect.top - 30}px`;

  const gameContainer = document.getElementById("gameContainer");
  const gameContainerRect = gameContainer.getBoundingClientRect();

  scoreAnimation.style.left = `${
    playerRect.left - gameContainerRect.left + playerRect.width / 2
  }px`;
  scoreAnimation.style.top = `${playerRect.top - gameContainerRect.top - 30}px`;

  gameContainer.appendChild(scoreAnimation);

  setTimeout(() => {
    scoreAnimation.remove();
  }, 1500);
}

function adjustSpeed() {
  if (speedIncreasing) {
    obstacleSpeed += 0.5;
    if (obstacleSpeed >= 12) speedIncreasing = false;
  } else {
    obstacleSpeed -= 0.3;
    if (obstacleSpeed <= 7) speedIncreasing = true;
  }
}

function endGame() {
  isGameOver = true;
  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  scoreElement.innerText = `Game Over! Final Score: ${score}`;
  gameOverScreen.style.display = "block";

  /*
  player.style.position = "absolute"; 
  player.style.top = `${player.offsetTop}px`; 
  player.style.left = `${player.offsetLeft}px`; */

  obstacles.forEach((obstacle) => {
    obstacle.style.animation = "none"; 
  });

  document.body.classList.add("shake");
  setTimeout(() => {
    document.body.classList.remove("shake");
  }, 500); 
}

function resetGame() {
  isGameOver = false;
  score = 0;
  scoreElement.innerText = `Score: ${score}, Best Record: ${bestRecord || "0"}`;

  player.removeAttribute("style");

  obstacles.forEach((obstacle) => obstacle.remove());
  obstacles = [];
  gameOverScreen.style.display = "none";
  obstacleSpeed = 7; 
  obstacleSpawnRate = 2000;
  speedIncreasing = true; 
  startGame();
}

function startGame() {
  isGameStart = true;
  isGameOver = false;
  isJumping = false;
  player.style.bottom = "20px";
  gameInterval = setInterval(moveObstacles, 20);
  obstacleInterval = setInterval(generateObstacle, obstacleSpawnRate);
}

startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  startGame();
});

restartButton.addEventListener("click", resetGame);

document.addEventListener("keydown", (event) => {
  if (
    !isGameOver &&
    (event.key === " " || event.key === "Space" || event.key === "ArrowUp")
  ) {
    if (!event.repeat) {
      jump();
    }
  }
});

gameContainer.addEventListener("click", (event) => {
  if (
    event.target.id !== "score" &&
    event.target.id !== "restartButton" &&
    event.target.id !== "startScreen" &&
    event.target.id !== "secondText" &&
    event.target.id !== "pauseScreen" &&
    event.target.id !== "startButton"
  ) {
    jump();
  }
});

musicButton.addEventListener("click", () => {
    musicControl();
});

function musicControl() {
    isMusicOn = !isMusicOn;
    localStorage.setItem("isMusicOn", isMusicOn);
    if (isMusicOn) {
        backgroundMusic.play();
        musicButton.src = "https://hop-run.vercel.app/assets/musicopen.png";
    } else {
        backgroundMusic.pause();
        musicButton.src = "https://hop-run.vercel.app/assets/musicoff.png";
    }
}

function startCountdown() {
  if (!isGameOver && isGameStart) {
    isGameStart = false;
    const secondTextElement = document.getElementById("secondText");
    secondTextElement.style.display = "block"; 
    secondTextElement.textContent = `Game starts in: ${countdown}`;
    document.getElementById("pauseScreen").style.display = "block"; 

    const gameContainer = document.getElementById("gameContainer");
    if (gameContainer.style.backgroundColor === "rgb(240, 240, 240)") { 
      secondTextElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; 
    } else if (gameContainer.style.backgroundColor === "rgb(0, 0, 0)") { 
      secondTextElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    }

    countdownInterval = setInterval(() => {
      countdown--;
      secondTextElement.textContent = `Game starts in: ${countdown}`;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        document.getElementById("pauseScreen").style.display = "none"; 
        isGameStart = true;

        gameInterval = setInterval(moveObstacles, 20);
        obstacleInterval = setInterval(generateObstacle, obstacleSpawnRate);
        countdown = 3;
      }
    }, 1000); 
  }
}

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") {
    if (!isGameOver && isGameStart) {
      document.title = "Hop & Run (Paused)";
      clearInterval(gameInterval);
      clearInterval(obstacleInterval);
    }
  } else {
    if (!isGameOver && isGameStart) {
      document.title = "Hop & Run";
      startCountdown();
    }
  }
});

function changeBackground() {
  if (!isGameOver && isGameStart) {
    backgroundChanges++; 

    if (backgroundChanges % 2 === 1) {
      gameContainer.style.backgroundColor = "#000000"; 
      sun.classList.remove("active"); 
      setTimeout(() => {
        sun.style.display = "none";
      }, 500); 
    } else {
      gameContainer.style.backgroundColor = "#f0f0f0"; 
      sun.style.display = "block"; 
      setTimeout(() => {
        sun.classList.add("active"); 
      }, 10);
    }
  }
}
setInterval(changeBackground, randomTime * 1000);

function playMusicOnInteraction() {
  if (isMusicOn) {
    backgroundMusic.play();
  }
}

document.addEventListener("click", playMusicOnInteraction);
document.addEventListener("keydown", playMusicOnInteraction);

function checkForJump() {
  if (!jumpCheckerActive) return; 
  obstacles.forEach((obstacle) => {
    let playerRect = player.getBoundingClientRect();
    let obstacleRect = obstacle.getBoundingClientRect();

    let distanceToObstacle = obstacleRect.left - playerRect.right;

    if (distanceToObstacle <= 140 && distanceToObstacle > 0) {
      jump();
    }
  });
}

setInterval(checkForJump, 100);

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "c") {
    jumpCheckerActive = !jumpCheckerActive;
    console.log(
      `Jump check is now ${jumpCheckerActive ? "active" : "inactive"}.`
    );
  }
});

if ("mediaSession" in navigator && "MediaMetadata" in window) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: "Impact Prelude",
    artist: "Kevin MacLeod",
    album: "Impact Prelude",
    artwork: [{ src: "https://hop-run.vercel.app/assets/logo.png", sizes: "512x512", type: "image/png" }],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    backgroundMusic.play();
    musicButton.src = "https://hop-run.vercel.app/assets/musicopen.png"; 
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    backgroundMusic.pause();
    musicButton.src = "https://hop-run.vercel.app/assets/musicoff.png"; 
  });

  navigator.mediaSession.setActionHandler("stop", () => {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    musicButton.src = "https://hop-run.vercel.app/assets/musicoff.png";
  });

  backgroundMusic.addEventListener("play", () => {
    navigator.mediaSession.playbackState = "playing";
    musicButton.src = "https://hop-run.vercel.app/assets/musicopen.png"; 
  });

  backgroundMusic.addEventListener("pause", () => {
    navigator.mediaSession.playbackState = "paused";
    musicButton.src = "https://hop-run.vercel.app/assets/musicoff.png";
  });
}

window.onbeforeunload = function (event) {
  if ((isGameOver)) return;
    if ((isGameStart)) {
        event.preventDefault();
        return "Are you sure you want to quit the game?";
    }
};

function checkAndReloadIfPlayerRemoved() {
  const player = document.getElementById("player");

  if (!player) {
    location.reload();
  }
}

setInterval(checkAndReloadIfPlayerRemoved, 300); 
