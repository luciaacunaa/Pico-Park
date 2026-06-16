let game = null;

const controllers = [];

let nextPlayerId = 1;

Bun.serve({
  port: 3000,

  fetch(req, server) {
    const url = new URL(req.url);

    if (
      server.upgrade(req, {
        data: {
          type: url.searchParams.get("type"),
        },
      })
    ) {
      return;
    }

    if (url.pathname === "/") {
      return new Response(Bun.file("./public/index.html"));
    }

    if (url.pathname === "/game.js") {
      return new Response(Bun.file("./public/game.js"));
    }

    return new Response("404");
  },

  websocket: {
    open(ws) {
      if (ws.data.type === "game") {
        game = ws;

        console.log("Juego conectado");

        return;
      }

      ws.playerId = nextPlayerId++;

      controllers.push(ws);

      console.log(`Controlador ${ws.playerId} conectado`);

      ws.send(
        JSON.stringify({
          type: "assignId",
          playerId: ws.playerId,
        }),
      );

      if (game) {
        game.send(
          JSON.stringify({
            type: "newPlayer",
            playerId: ws.playerId,
          }),
        );
      }
    },

    message(ws, message) {
      console.log("Mensaje:", message);

      if (ws.data.type !== "controller") {
        return;
      }

      if (game) {
        game.send(message);
      }
    },
    close(ws) {
      if (ws.data.type === "game") {
        console.log("Juego desconectado");

        game = null;

        return;
      }

      console.log(`Controlador ${ws.playerId} desconectado`);

      const index = controllers.indexOf(ws);

      if (index !== -1) {
        controllers.splice(index, 1);
      }

      if (game) {
        game.send(
          JSON.stringify({
            type: "removePlayer",
            playerId: ws.playerId,
          }),
        );
      }
    },
  },
});

console.log("Servidor iniciado");
console.log("http://localhost:3000");
