const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

let players = {};
const MAX_PLAYERS = 4;

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  if (Object.keys(players).length >= MAX_PLAYERS) {
    socket.emit("full");
    return;
  }

  players[socket.id] = {
    x: 100 + Math.random() * 200,
    y: 300,
    vx: 0,
    vy: 0,
    input: {},
    color: getColor()
  };

  socket.emit("init", { id: socket.id });

  socket.on("input", (input) => {
    players[socket.id].input = input;
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    console.log("Jugador desconectado:", socket.id);
  });
});

// loop 30 FPS
setInterval(() => {
  updatePhysics();
  io.emit("state", players);
}, 1000 / 30);

// física básica
function updatePhysics() {
  const gravity = 0.5;
  const ground = 400;

  for (let id in players) {
    let p = players[id];

    // movimiento horizontal
    if (p.input.left) p.vx = -3;
    else if (p.input.right) p.vx = 3;
    else p.vx = 0;

    // salto
    if (p.input.jump && p.y >= ground) {
      p.vy = -10;
    }

    // gravedad
    p.vy += gravity;

    // aplicar movimiento
    p.x += p.vx;
    p.y += p.vy;

    // suelo
    if (p.y > ground) {
      p.y = ground;
      p.vy = 0;
    }

    // paredes
    if (p.x < 0) p.x = 0;
    if (p.x > 800) p.x = 800;
  }
}

function getColor() {
  const colors = ["red", "blue", "green", "yellow"];
  return colors[Math.floor(Math.random() * colors.length)];
}

server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});