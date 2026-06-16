const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.8;

// Cualquier jugador (o caja) que caiga por debajo de esta línea cayó "al vacío"
const VOID_Y = canvas.height + 150;

// Cuántos jugadores hacen falta para que el nivel termine
const REQUIRED_PLAYERS = 4;

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

// ---------- NUEVO: cajas ----------
const boxes = [
  {
    x: 500,
    y: canvas.height - 50 - 60,
    width: 60,
    height: 60,
    velocityY: 0,
    grounded: false,
    speed: 3, // velocidad fija al moverse, NO se suma con más empujadores
    requiredPushers: 2, // jugadores necesarios del mismo lado para moverla
    pushersLeft: new Set(),
    pushersRight: new Set(),
  },
];

// ---------- NUEVO: llave ----------
const key = {
  x: 150,
  y: canvas.height - 50 - 30,
  width: 24,
  height: 30,
  carriedBy: null, // null = nadie la tiene
  spawnX: 150,
  spawnY: canvas.height - 50 - 30,
};

// ---------- NUEVO: puerta + zona de salida ----------
const door = {
  x: canvas.width - 80,
  y: canvas.height - 50 - 120,
  width: 40,
  height: 120,
  locked: true,
};

const exitZone = {
  x: canvas.width - 220,
  y: canvas.height - 50 - 150,
  width: 220,
  height: 150,
};

let gameWon = false;

const colors = ["red", "blue", "green", "yellow", "purple"];

const socket = new WebSocket("ws://localhost:3000?type=game");

function overlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function respawnPlayer(player) {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.velocityY = 0;
}

function respawnKey() {
  key.carriedBy = null;
  key.x = key.spawnX;
  key.y = key.spawnY;
}

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Nuevo jugador
  if (data.type === "newPlayer") {
    const spawnX = 100 + Object.keys(players).length * 80;
    const spawnY = 100;

    players[data.playerId] = {
      x: spawnX,
      y: spawnY,

      spawnX,
      spawnY,

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
    // si se desconecta justo cuando tenía la llave, que no quede "perdida"
    if (key.carriedBy === data.playerId) {
      respawnKey();
    }
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

    // NUEVO: botón A para agarrar / soltar la llave
    if (data.action === "a") {
      if (key.carriedBy === data.playerId) {
        // soltarla donde está parado
        key.carriedBy = null;
        key.x = player.x;
        key.y = player.y - 10;
      } else if (key.carriedBy === null && overlap(player, key)) {
        // solo puede agarrarla si nadie la tiene
        key.carriedBy = data.playerId;
      }
    }
  }
};

function update() {
  // reset de empujadores de cada caja, se recalcula cada frame
  for (const box of boxes) {
    box.pushersLeft = new Set();
    box.pushersRight = new Set();
  }

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

    // NUEVO: colisión / empuje con cajas
    for (const box of boxes) {
      if (
        player.x < box.x + box.width &&
        player.x + player.width > box.x &&
        player.y < box.y + box.height &&
        player.y + player.height > box.y
      ) {
        if (moveX > 0) {
          box.pushersRight.add(id);
          player.x = box.x - player.width; // no atraviesa la caja
        }

        if (moveX < 0) {
          box.pushersLeft.add(id);
          player.x = box.x + box.width;
        }
      }
    }

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

    // NUEVO: parado arriba de una caja
    for (const box of boxes) {
      if (
        player.x < box.x + box.width &&
        player.x + player.width > box.x &&
        player.y + player.height >= box.y &&
        player.y + player.height <= box.y + 20 &&
        player.velocityY >= 0
      ) {
        player.y = box.y - player.height;

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

    // NUEVO: cayó al vacío -> respawn (y si tenía la llave, la llave también respawnea)
    if (player.y > VOID_Y) {
      if (key.carriedBy === id) {
        respawnKey();
      }
      respawnPlayer(player);
    }
  }

  // NUEVO: mover cada caja según quién la está empujando (velocidad fija, no se suma)
  for (const box of boxes) {
    let moved = 0;

    if (box.pushersRight.size >= box.requiredPushers) {
      moved = box.speed;
      // Si en algún nivel querés que sea más rápida con más gente, sería algo como:
      // moved = box.speed + (box.pushersRight.size - box.requiredPushers) * BONUS
    } else if (box.pushersLeft.size >= box.requiredPushers) {
      moved = -box.speed;
    }

    if (moved !== 0) {
      box.x += moved;

      // arrastramos a los que la empujan para que no se "despeguen" de la caja
      const pushers = moved > 0 ? box.pushersRight : box.pushersLeft;
      for (const pusherId of pushers) {
        players[pusherId].x += moved;
      }
    }

    // gravedad simple para la caja
    box.velocityY += gravity;
    box.y += box.velocityY;
    box.grounded = false;

    for (const platform of platforms) {
      if (
        box.x < platform.x + platform.width &&
        box.x + box.width > platform.x &&
        box.y + box.height >= platform.y &&
        box.y + box.height <= platform.y + 20 &&
        box.velocityY >= 0
      ) {
        box.y = platform.y - box.height;
        box.velocityY = 0;
        box.grounded = true;
      }
    }
  }

  // NUEVO: la llave sigue a quien la está cargando
  if (key.carriedBy !== null) {
    const carrier = players[key.carriedBy];

    if (carrier) {
      key.x = carrier.x + carrier.width / 2 - key.width / 2;
      key.y = carrier.y - key.height - 5;
    } else {
      // por si quedó referenciando a un jugador que ya no existe
      respawnKey();
    }
  }

  // NUEVO: la puerta se desbloquea cuando la llave (en mano de alguien) la toca
  if (door.locked && key.carriedBy !== null && overlap(key, door)) {
    door.locked = false;
  }

  // NUEVO: condición de victoria — puerta abierta + los 4 jugadores en la zona de salida
  const playerIds = Object.keys(players);

  if (
    !gameWon &&
    !door.locked &&
    playerIds.length === REQUIRED_PLAYERS &&
    playerIds.every((id) => overlap(players[id], exitZone))
  ) {
    gameWon = true;
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

  // NUEVO: zona de salida (se pone verde cuando la puerta está abierta)
  ctx.fillStyle = door.locked
    ? "rgba(255,255,255,0.06)"
    : "rgba(46,204,113,0.18)";
  ctx.fillRect(exitZone.x, exitZone.y, exitZone.width, exitZone.height);

  // NUEVO: puerta
  ctx.fillStyle = door.locked ? "#8B4513" : "#2ecc71";
  ctx.fillRect(door.x, door.y, door.width, door.height);

  // NUEVO: cajas
  ctx.fillStyle = "#c9a25b";
  for (const box of boxes) {
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }

  // NUEVO: llave
  ctx.fillStyle = "gold";
  ctx.fillRect(key.x, key.y, key.width, key.height);

  // Jugadores
  for (const id in players) {
    const player = players[id];

    ctx.fillStyle = player.color;

    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "white";

    ctx.font = "20px Arial";

    ctx.fillText(id, player.x + 18, player.y + 30);
  }

  // NUEVO: pantalla de victoria
  if (gameWon) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("¡NIVEL COMPLETADO!", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
  }
}

function gameLoop() {
  if (!gameWon) {
    update();
  }

  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
