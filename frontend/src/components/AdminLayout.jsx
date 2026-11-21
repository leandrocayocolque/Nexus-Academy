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

  const linkActivo = (path) => location.pathname === path ||
    (path !== '/admin' && location.pathname.startsWith(path + '/'));
  const enlaces = [
    ['/admin', 'Resumen'],
    ['/admin/cursos', 'Cursos'],
    ['/admin/categorias', 'Categorías'],
    ['/admin/promociones', 'Promociones'],
    ['/admin/consultas', 'Consultas'],
    ['/admin/perfil', 'Mi perfil'],
    ['/admin/registro', 'Crear administrador'],
    ['/admin/negocio', 'Comercio'],
  ];

  return (
    <div className="admin-shell">
      
      <aside className="admin-sidebar">
        <h3 className="admin-sidebar-title">Panel de gestión</h3>
        <nav aria-label="Gestión de la academia">
          {enlaces.map(([path, texto]) => (
            <Link key={path} to={path} className="admin-sidebar-link"
              aria-current={linkActivo(path) ? 'page' : undefined}>
              {texto}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}