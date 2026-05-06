const players = {};
const sockets = new Set();

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",

  fetch(req, server) {
    // 🔥 ESTO SIEMPRE PRIMERO
    if (server.upgrade(req)) return;

    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("./public/index.html"));
    }

    if (url.pathname === "/game.js") {
      return new Response(Bun.file("./public/game.js"));
    }

    if (url.pathname === "/controller.html") {
      return new Response(Bun.file("./public/controller.html"));
    }

    return new Response("Not found", { status: 404 });
  },

  websocket: {
    open(ws) {
      ws.id = crypto.randomUUID();
      sockets.add(ws);

      players[ws.id] = {
        x: 200,
        y: 300,
        vx: 0,
        vy: 0,
        input: { left: false, right: false, jump: false },
        color: "red"
      };

      console.log("🟢 Jugador conectado:", ws.id);
    },

    message(ws, message) {
      const data = JSON.parse(message);

      if (data.type === "input") {
        players[ws.id].input = data.input;
      }
    },

    close(ws) {
      sockets.delete(ws);
      delete players[ws.id];
      console.log("🔴 Jugador desconectado");
    }
  }
});

// LOOP
setInterval(() => {
  updatePhysics(); // 👈 ESTO FALTABA

  const state = JSON.stringify({
    type: "state",
    players
  });

  sockets.forEach(ws => ws.send(state));
}, 1000 / 30);

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

    // límites
    if (p.x < 0) p.x = 0;
    if (p.x > 760) p.x = 760;
  }
}

console.log("Servidor corriendo en http://localhost:3000");