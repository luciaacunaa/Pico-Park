const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.8;

const players = {};

const platforms = [
  {
    x: 0,
    y: canvas.height - 50,
    width: canvas.width,
    height: 50,
  },

  {
    x: 300,
    y: 500,
    width: 250,
    height: 30,
  },

  {
    x: 700,
    y: 400,
    width: 250,
    height: 30,
  },
];

const colors = ["red", "blue", "green", "yellow", "purple"];

const socket = new WebSocket("ws://localhost:3000?type=game");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Nuevo jugador
  if (data.type === "newPlayer") {
    players[data.playerId] = {
      x: 100 + Object.keys(players).length * 80,
      y: 100,

      width: 50,
      height: 50,

      speed: 5,

      velocityY: 0,
      jumpForce: -15,

      grounded: false,

      left: false,
      right: false,

      color: colors[Object.keys(players).length % colors.length],
    };

    console.log("Jugador creado:", data.playerId);
  }

  // Jugador desconectado
  if (data.type === "removePlayer") {
    delete players[data.playerId];
  }

  // Inputs
  if (data.playerId) {
    const player = players[data.playerId];

    if (!player) return;

    if (data.action === "leftDown") {
      player.left = true;
    }

    if (data.action === "leftUp") {
      player.left = false;
    }

    if (data.action === "rightDown") {
      player.right = true;
    }

    if (data.action === "rightUp") {
      player.right = false;
    }

    if (data.action === "jump" && player.grounded) {
      player.velocityY = player.jumpForce;

      player.grounded = false;
    }
  }
};

function update() {
  for (const id in players) {
    const player = players[id];

    // Movimiento horizontal
    let moveX = 0;

    if (player.left) {
      moveX -= player.speed;
    }

    if (player.right) {
      moveX += player.speed;
    }

    player.x += moveX;

    // Colisión lateral con otros jugadores
    for (const otherId in players) {
      if (id === otherId) {
        continue;
      }

      const other = players[otherId];

      if (
        player.x < other.x + other.width &&
        player.x + player.width > other.x &&
        player.y < other.y + other.height &&
        player.y + player.height > other.y
      ) {
        if (moveX > 0) {
          player.x = other.x - player.width;
        }

        if (moveX < 0) {
          player.x = other.x + other.width;
        }
      }
    }

    // Gravedad
    player.velocityY += gravity;

    player.y += player.velocityY;

    player.grounded = false;

    // Plataformas
    for (const platform of platforms) {
      if (
        player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + 20 &&
        player.velocityY >= 0
      ) {
        player.y = platform.y - player.height;

        player.velocityY = 0;

        player.grounded = true;
      }
    }

    // Colisión vertical con otros jugadores
    for (const otherId in players) {
      if (id === otherId) {
        continue;
      }

      const other = players[otherId];

      if (
        player.x < other.x + other.width &&
        player.x + player.width > other.x &&
        player.y + player.height >= other.y &&
        player.y + player.height <= other.y + 20 &&
        player.velocityY >= 0
      ) {
        player.y = other.y - player.height;

        player.velocityY = 0;

        player.grounded = true;
      }
    }

    // Límites de pantalla
    if (player.x < 0) {
      player.x = 0;
    }

    if (player.x + player.width > canvas.width) {
      player.x = canvas.width - player.width;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo
  ctx.fillStyle = "#222";

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Plataformas
  ctx.fillStyle = "#888";

  for (const platform of platforms) {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  }

  // Jugadores
  for (const id in players) {
    const player = players[id];

    ctx.fillStyle = player.color;

    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "white";

    ctx.font = "20px Arial";

    ctx.fillText(id, player.x + 18, player.y + 30);
  }
}

function gameLoop() {
  update();

  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
