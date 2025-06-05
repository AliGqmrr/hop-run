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
const randomTime = Math.random() * (60 - 30) + 30;

let countdown = 3;
let countdownInterval; // Geri sayım için interval değişkeni
let isMusicOn = localStorage.getItem("isMusicOn") === "true" || false; // Yerel depolamadan oku, yoksa varsayılan false
let isJumping = false;
let isGameStart = false;
let isGameOver = false;
let verifiedScore = 0;
let score = 0;
let obstacles = [];
let gameInterval, obstacleInterval;
let obstacleSpeed = 7; // Başlangıç hızı
let obstacleSpawnRate = 2000; // Başlangıç spawn aralığı (ms)
let speedIncreasing = true; // Hız artış yönü
let lastObstacleTime = 0; // Son obstacle oluşturma zamanı
let minTimeBetweenObstacles = 1500;
let backgroundChanges = 0; // Çalıştırılma sayısını takip eden sayaç
let jumpCheckerActive = false; // Başlangıçta pasif
let bestRecord = getLocalStorage("bestRecord") || 0;

if (bestRecord && typeof bestRecord === "string") {
  bestRecord = parseFloat(bestRecord.toString().trim());
}
window.onload = () => {
  // Düzeltilmiş değeri tekrar localStorage'a kaydet
  setLocalStorage("bestRecord", parseFloat(bestRecord.toString().trim()), 365);

  if (bestRecord !== undefined && bestRecord !== null && bestRecord !== "") {
    scoreElement.innerText = `Score: ${score}, Best Record: ${bestRecord}`;
    bestRecordElement.innerHTML = `Your Best Record: ${bestRecord}`;
  } else {
    bestRecordElement.innerHTML = "Your Best Record: 0";
    scoreElement.innerText = `Score: ${score}, Best Record: 0`;
  }
};

function setLocalStorage(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  const data = {
    value: cvalue,
    expires: d.getTime(), // Son kullanma zamanını milisaniye olarak saklıyoruz
  };
  localStorage.setItem(cname, JSON.stringify(data));
}

function getLocalStorage(cname) {
  const item = localStorage.getItem(cname);
  if (!item) return "0"; // Veri hiç yoksa

  try {
    const data = JSON.parse(item);
    const now = Date.now();

    // Süresi dolmuşsa silinir
    if (now > data.expires) {
      localStorage.removeItem(cname);
      return "0";
    }

    return data.value; // Her şey yolundaysa değeri döner
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
          player.style.bottom = "20px"; // Zemin seviyesini koru
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

    if (
      obstacleRect.right <= gameContainerRect.left ||
      obstacleRect.left >= gameContainerRect.right
    ) {
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

  // Skoru sarı yapmak için kontrol ekliyoruz
  if (score > bestRecord) {
    scoreAnimation.style.color = "yellow"; // Sarı renk
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
  restartButton.style.display = "block";

  /* // Player'ın hareketini durduruyoruz
  player.style.position = "absolute"; // Player'ı sabitliyoruz
  player.style.top = `${player.offsetTop}px`; // Yüksekliğini koruyoruz
  player.style.left = `${player.offsetLeft}px`; // Konumunu koruyoruz*/

  // Engellerin hareketini durduruyoruz
  obstacles.forEach((obstacle) => {
    obstacle.style.animation = "none"; // Engellerin animasyonlarını durduruyoruz
  });

  // Ekran titreme efekti ekle
  document.body.classList.add("shake");
  setTimeout(() => {
    document.body.classList.remove("shake");
  }, 500); // 500ms sonra titreme durur
}

function resetGame() {
  isGameOver = false;
  score = 0;
  scoreElement.innerText = `Score: ${score}, Best Record: ${bestRecord || "0"}`;

  // Player'ın tüm stil özelliklerini sıfırlıyoruz
  player.removeAttribute("style");

  restartButton.style.display = "none";
  obstacles.forEach((obstacle) => obstacle.remove());
  obstacles = [];
  obstacleSpeed = 7; // Başlangıç değerlerini sıfırla
  obstacleSpawnRate = 2000;
  speedIncreasing = true; // Hız artışı yönünü sıfırla
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
  // Hem boşluk tuşu ("Space" ve " " karakteri) hem de yukarı ok tuşuna basıldığında jump fonksiyonu çalışacak
  if (
    !isGameOver &&
    (event.key === " " || event.key === "Space" || event.key === "ArrowUp")
  ) {
    if (!event.repeat) {
      // Tekrar basılmasını engelle
      jump();
    }
  }
});

gameContainer.addEventListener("click", (event) => {
  // Eğer tıklanan hedef score, restartButton ya da startScreen değilse jump() çalışır
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

function startCountdown() {
  if (!isGameOver && isGameStart) {
    isGameStart = false;
    const secondTextElement = document.getElementById("secondText");
    secondTextElement.style.display = "block"; // Geri sayım metnini göster
    secondTextElement.textContent = `Game starts in: ${countdown}`;
    document.getElementById("pauseScreen").style.display = "block"; // Pause ekranını göster

    // gameContainer'ın arka plan rengini kontrol et
    const gameContainer = document.getElementById("gameContainer");
    if (gameContainer.style.backgroundColor === "rgb(240, 240, 240)") {
      // Eğer beyaz ise
      secondTextElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Siyah, yarı saydam
    } else if (gameContainer.style.backgroundColor === "rgb(0, 0, 0)") {
      // Eğer siyah ise
      secondTextElement.style.backgroundColor = "rgba(255, 255, 255, 0.5)"; // Beyaz, yarı saydam
    }

    countdownInterval = setInterval(() => {
      countdown--;
      secondTextElement.textContent = `Game starts in: ${countdown}`;
      if (countdown <= 0) {
        clearInterval(countdownInterval); // Geri sayımı durdur
        document.getElementById("pauseScreen").style.display = "none"; // Pause ekranını göster
        isGameStart = true;

        // Oyunu başlat
        gameInterval = setInterval(moveObstacles, 20);
        obstacleInterval = setInterval(generateObstacle, obstacleSpawnRate);
        countdown = 3;
      }
    }, 1000); // 1 saniyede bir geri sayım
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
      // Oyunu başlatmadan önce geri sayımı tetikle
      startCountdown();
    }
  }
});

function changeBackground() {
  if (!isGameOver && isGameStart) {
    backgroundChanges++; // Sayaç artırılır

    if (backgroundChanges % 2 === 1) {
      gameContainer.style.backgroundColor = "#000000"; // Siyah (tek sayılar)
      sun.classList.remove("active"); // Yavaşça kaybolma
      setTimeout(() => {
        sun.style.display = "none";
      }, 500); // Opaklık animasyonu tamamlandıktan sonra display: none
    } else {
      gameContainer.style.backgroundColor = "#f0f0f0"; // Beyaz (çift sayılar)
      sun.style.display = "block"; // Önce görünür yap
      setTimeout(() => {
        sun.classList.add("active"); // Yavaşça görünme efekti
      }, 10);
    }
  }
}
setInterval(changeBackground, randomTime * 1000);

function checkForJump() {
  if (!jumpCheckerActive) return; // Do nothing if not active

  obstacles.forEach((obstacle) => {
    let playerRect = player.getBoundingClientRect();
    let obstacleRect = obstacle.getBoundingClientRect();

    // Calculate the distance between the player and the obstacle
    let distanceToObstacle = obstacleRect.left - playerRect.right;

    // Jump if the distance is short enough
    if (distanceToObstacle <= 150 && distanceToObstacle > 0) {
      jump();
    }
  });
}

// Check every 100 ms
setInterval(checkForJump, 100);

// Toggle the jump check when the "C" key is pressed
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "c") {
    // "C" key
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
    artwork: [{ src: "/assets/logo.png", sizes: "512x512", type: "image/png" }],
  });

  // Medya kontrol butonları (ileri, geri, duraklat) için olaylar
  navigator.mediaSession.setActionHandler("play", () => {
    backgroundMusic.play();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    backgroundMusic.pause();
  });

  navigator.mediaSession.setActionHandler("stop", () => {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  });

  // Oynatma başladığında güncellemeyi sağla
  backgroundMusic.addEventListener("play", () => {
    navigator.mediaSession.playbackState = "playing";
  });

  // Durdurulduğunda güncellemeyi sağla
  backgroundMusic.addEventListener("pause", () => {
    navigator.mediaSession.playbackState = "paused";
  });
} else {
  // Tarayıcı Media Session API'yi desteklemiyor
}

window.onbeforeunload = function (event) {
  if (isGameOver) return;
  if (isGameStart) {
    event.preventDefault();
    return "Are you sure you want to quit the game?";
  }
};

function checkAndReloadIfPlayerRemoved() {
  const player = document.getElementById("player");

  if (!player) {
    // Player silindiyse, sayfayı yeniden yükle
    location.reload();
  }
}

// Bu fonksiyonu belirli aralıklarla çalıştırmak için setInterval ekleyelim
setInterval(checkAndReloadIfPlayerRemoved, 300);
