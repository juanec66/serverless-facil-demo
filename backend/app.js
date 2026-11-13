"use strict";

// Lambda con Node.js nativo: sin Express, sin npm install y sin base de datos.
exports.handler = async (event) => {
  const nombre = String(event.queryStringParameters?.nombre ?? "estudiante")
    .trim()
    .slice(0, 40) || "estudiante";

  const payload = {
    mensaje: `¡Hola, ${nombre}! Tu primera API serverless funciona.`,
    servicio: "AWS Lambda",
    fecha: new Date().toISOString()
  };

  console.log(JSON.stringify({ accion: "saludo", nombre }));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(payload)
  };
};
