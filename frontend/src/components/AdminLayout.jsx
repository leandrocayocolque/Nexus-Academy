import React from 'react';
import './AdminResponsive.css';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../auth/SesionContext.js';
import { destinoAdmin } from '../auth/sesion.js';

export default function AdminLayout() {
  const location = useLocation();
  const { estado } = useSesion();
  if (estado === 'cargando') return <p role="status">Validando acceso…</p>;
  if (estado !== 'autenticada') {
    return <Navigate to="/login" replace state={{
      desde: destinoAdmin(location.pathname + location.search + location.hash),
    }} />;
  }

  // Función para resaltar la pestaña activa en la barra lateral
  const getLinkStyle = (path) => ({
    display: 'block',
    padding: '1rem',
    color: location.pathname === path || location.pathname.startsWith(path + '/') && path !== '/admin' ? 'var(--primary-green)' : '#d1d5db',
    backgroundColor: location.pathname === path || location.pathname.startsWith(path + '/') && path !== '/admin' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
    textDecoration: 'none',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    transition: 'all 0.2s',
    fontWeight: '500'
  });

  return (
    <div className="admin-shell">
      
      {/* Barra Lateral (Sidebar) */}
      <aside className="admin-sidebar">
        <h3 style={{ color: 'var(--text-main)', margin: '0 0 2rem 1rem', fontSize: '1.2rem' }}>Panel de Gestión</h3>
        <nav aria-label="Gestión de la academia">
          {/* Usamos coincidencia exacta para el inicio del dashboard */}
          <Link to="/admin" style={location.pathname === '/admin' ? { ...getLinkStyle('/admin'), color: 'var(--primary-green)', backgroundColor: 'rgba(16, 185, 129, 0.1)' } : getLinkStyle('/admin')}>
            📊 Dashboard
          </Link>
          <Link to="/admin/cursos" style={getLinkStyle('/admin/cursos')}>
            📚 Cursos
          </Link>
          <Link to="/admin/categorias" style={getLinkStyle('/admin/categorias')}>
            🏷️ Categorías
          </Link>
          <Link to="/admin/promociones" style={getLinkStyle('/admin/promociones')}>
            📣 Promociones
          </Link>
          <Link to="/admin/consultas" style={getLinkStyle('/admin/consultas')}>
            ✉️ Consultas
          </Link>
          <Link to="/admin/perfil" style={getLinkStyle('/admin/perfil')}>
            👤 Mi Perfil
          </Link>
          <Link to="/admin/negocio" style={getLinkStyle('/admin/negocio')}>
            🏢 Comercio
          </Link>
        </nav>
      </aside>

      {/* Área de Contenido Dinámico */}
      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}