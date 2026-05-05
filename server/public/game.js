const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// estado del server
let players = {};

// input local (teclado)
let input = {
  left: false,
  right: false,
  jump: false
};

// recibir estado del server
socket.on("state", (serverPlayers) => {
  players = serverPlayers;
});

// =====================
// 🎮 CONTROLES TECLADO
// =====================
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") input.left = true;
  if (e.key === "ArrowRight") input.right = true;
  if (e.key === "ArrowUp") input.jump = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") input.left = false;
  if (e.key === "ArrowRight") input.right = false;
  if (e.key === "ArrowUp") input.jump = false;
});

// mandar input al server (30 FPS)
setInterval(() => {
  socket.emit("input", input);
}, 1000 / 30);

// =====================
// 🎨 RENDER
// =====================
function draw() {
  // limpiar pantalla
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // fondo
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // suelo
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 400, 800, 50);

  // jugadores
  for (let id in players) {
    const p = players[id];

    ctx.fillStyle = p.color || "black";
    ctx.fillRect(p.x, p.y, 40, 40);
  }

  requestAnimationFrame(draw);
}

// iniciar loop
draw();