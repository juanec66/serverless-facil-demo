"use strict";

// Emula localmente el contrato que usa la Lambda, sin Docker ni librerías.
const http = require("node:http");
const { handler } = require("./app.js");
const port = Number(process.env.PORT || 3000);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  if (request.method !== "GET" || url.pathname !== "/api/saludo") {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Ruta no encontrada" }));
    return;
  }
  try {
    const answer = await handler({
      queryStringParameters: Object.fromEntries(url.searchParams)
    });
    response.writeHead(answer.statusCode, answer.headers);
    response.end(answer.body);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Error interno" }));
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`API local: http://127.0.0.1:${port}/api/saludo?nombre=Ana`);
});
