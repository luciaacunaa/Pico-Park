const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let players = {};

socket.on("state", (serverPlayers) => {
  players = serverPlayers;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // suelo
  ctx.fillStyle = "black";
  ctx.fillRect(0, 420, 800, 30);

  for (let id in players) {
    const p = players[id];

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 40, 40);
  }

  requestAnimationFrame(draw);
}

draw();