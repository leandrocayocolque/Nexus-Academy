import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();

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
    <div style={{ display: 'flex', minHeight: '80vh', maxWidth: '1400px', margin: '2rem auto', gap: '2rem', padding: '0 2rem' }}>
      
      {/* Barra Lateral (Sidebar) */}
      <aside style={{ width: '250px', flexShrink: 0, backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333', alignSelf: 'start', position: 'sticky', top: '100px' }}>
        <h3 style={{ color: 'var(--text-main)', margin: '0 0 2rem 1rem', fontSize: '1.2rem' }}>Panel de Gestión</h3>
        <nav>
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
          <Link to="/admin/consultas" style={getLinkStyle('/admin/consultas')}>
            ✉️ Consultas
          </Link>
        </nav>
      </aside>

      {/* Área de Contenido Dinámico */}
      <main style={{ flex: 1, backgroundColor: 'var(--bg-card)', padding: '2.5rem', borderRadius: '12px', border: '1px solid #333' }}>
        <Outlet />
      </main>

    </div>
  );
}