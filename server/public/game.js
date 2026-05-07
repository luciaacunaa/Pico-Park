const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: 100,
  y: 100,
  size: 50,
  speed: 10,
};

const socket = new WebSocket("ws://localhost:3000");

socket.onopen = () => {
  console.log("WebSocket conectado");
};

socket.onmessage = (event) => {
  const action = event.data;

  if (action === "up") {
    player.y -= player.speed;
  }

  if (action === "down") {
    player.y += player.speed;
  }

  if (action === "left") {
    player.x -= player.speed;
  }

  if (action === "right") {
    player.x += player.speed;
  }

  draw();
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";

  ctx.fillRect(
    player.x,
    player.y,
    player.size,
    player.size
  );
}

draw();