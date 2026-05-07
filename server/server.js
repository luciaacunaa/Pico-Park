const clients = [];

Bun.serve({
  port: 3000,

  fetch(req, server) {
    const url = new URL(req.url);

    // websocket
    if (server.upgrade(req)) {
      return;
    }

    // index
    if (url.pathname === "/") {
      return new Response(
        Bun.file("./public/index.html")
      );
    }

    // game.js
    if (url.pathname === "/game.js") {
      return new Response(
        Bun.file("./public/game.js")
      );
    }

    return new Response("404");
  },

  websocket: {
    open(ws) {
      clients.push(ws);
      console.log("Jugador conectado");
    },

    message(ws, message) {
      console.log("Mensaje:", message);

      for (const client of clients) {
        client.send(message);
      }
    },

    close(ws) {
      console.log("Desconectado");
    },
  },
});

console.log("Servidor iniciado");
console.log("http://localhost:3000");