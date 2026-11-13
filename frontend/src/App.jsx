import { useState } from 'react';
import './App.css';

export default function App() {
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('Escribí tu nombre y probá la API.');
  const [fecha, setFecha] = useState('');
  const [cargando, setCargando] = useState(false);

  async function saludar(event) {
    event.preventDefault();
    setCargando(true);
    setMensaje('Consultando AWS Lambda...');
    setFecha('');

    try {
      // En producción, CloudFront enruta /api/* hacia API Gateway.
      // En local, Vite redirige /api/* a Node.js en el puerto 3000.
      const url = `/api/saludo?nombre=${encodeURIComponent(nombre.trim())}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMensaje(data.mensaje);
      setFecha(`Respuesta de la nube: ${data.fecha}`);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo consultar la API. Revisá la consola.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="page">
      <div className="eyebrow">AWS · React + Lambda + API Gateway + CloudFront</div>
      <section className="panel">
        <div className="marker">01 / MI PRIMERA APP</div>
        <h1>¡Hola, serverless!</h1>
        <p className="lead">
          El sitio está en <strong>S3 + CloudFront</strong> y el saludo viene de <strong>Lambda</strong>.
        </p>
        <form onSubmit={saludar}>
          <label htmlFor="nombre">¿Cómo te llamás?</label>
          <div className="input-row">
            <input
              id="nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ejemplo: Ana"
              maxLength={40}
            />
            <button type="submit" disabled={cargando}>
              {cargando ? 'Consultando...' : 'Llamar a la API'}
            </button>
          </div>
        </form>
        <div className="respuesta" aria-live="polite">
          <span className="pill">GET /api/saludo</span>
          <p>{mensaje}</p>
          {fecha && <small>{fecha}</small>}
        </div>
      </section>
      <footer>Frontend estático + backend por demanda · Un solo dominio HTTPS</footer>
    </main>
  );
}
