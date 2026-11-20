import React, { useEffect, useState } from 'react';
import { useSesion } from '../auth/SesionContext';

export default function Dashboard() {
  const { academia } = useSesion();
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    academia.obtenerResumenAdmin({ signal: controller.signal }).then(datos => {
      if (!controller.signal.aborted) setResumen(datos);
    }).catch(fallo => {
      if (!controller.signal.aborted) setError(fallo.message);
    });
    return () => controller.abort();
  }, [academia, intento]);

  if (error) return <div role="alert">No se pudo cargar el resumen. {error} <button onClick={() => { setError(''); setResumen(null); setIntento(i => i + 1); }}>Reintentar</button></div>;
  if (!resumen) return <p role="status">Cargando resumen...</p>;
  const { cursosActivos: totalCursos, categoriasActivas: totalCategorias, consultasPendientes } = resumen;

  return (
    <div>
      <header className="admin-page-header">
        <h2>Resumen general</h2>
      </header>
      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <h3>Cursos activos</h3>
          <p className="admin-summary-value">{totalCursos}</p>
        </div>
        <div className="admin-summary-card">
          <h3>Categorías activas</h3>
          <p className="admin-summary-value">{totalCategorias}</p>
        </div>
        <div className={`admin-summary-card${consultasPendientes > 0 ? ' admin-summary-pending' : ''}`}>
          <h3>Consultas pendientes</h3>
          <p className="admin-summary-value">{consultasPendientes}</p>
        </div>
      </div>
      <div className="admin-system-info">
        <h3>Estado del sistema</h3>
        <ul>
          <li>
            El catálogo público cuenta actualmente con <strong>{totalCursos}</strong> opciones educativas distribuidas en <strong>{totalCategorias}</strong> áreas de estudio.
          </li>
          <li>
            {consultasPendientes > 0
              ? `Tenés ${consultasPendientes} mensajes nuevos esperando respuesta en la bandeja de entrada.`
              : 'Tu bandeja de consultas está al día, no hay mensajes pendientes.'}
          </li>
        </ul>
      </div>
    </div>
  );
}
