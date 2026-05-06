const socket = new WebSocket("ws://127.0.0.1:3000");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let players = {};

let input = {
  left: false,
  right: false,
  jump: false
};

socket.onopen = () => {
  console.log("🟢 CONECTADO AL SERVER");
};

socket.onerror = (e) => {
  console.log("🔴 ERROR WS", e);
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "state") {
    players = data.players;
  }
};

// teclado
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

// enviar input
setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "input",
      input
    }));
  }
}, 1000 / 30);

// render
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#333";
  ctx.fillRect(0, 400, 800, 50);

  // debug
  ctx.fillStyle = "black";
  ctx.fillText("Players: " + Object.keys(players).length, 10, 20);

  for (let id in players) {
    const p = players[id];

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 40, 40);
  }

  requestAnimationFrame(draw);
}

draw();