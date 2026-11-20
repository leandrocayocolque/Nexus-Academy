import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSesion } from '../auth/SesionContext.js';
import { useNegocio } from './NegocioContext.jsx';
import './PublicResponsive.css';
import './AdminResponsive.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Nos permite saber en qué ruta estamos para iluminar el menú
  
  const { estado, logout } = useSesion();
  const { negocio } = useNegocio();
  const isAdmin = estado === 'autenticada';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLinkStyle = (path) => ({
    color: location.pathname === path ? 'var(--text-main)' : '#9ca3af',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
  });

  return (
    <nav className={isAdmin ? 'admin-navbar' : 'public-navbar'} aria-label="Navegación principal" style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      backgroundColor: 'rgba(10, 10, 10, 0.75)', 
      backdropFilter: 'blur(12px)', 
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      zIndex: 100 
    }}>
      <div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 style={{ 
            margin: 0, 
            color: 'var(--text-main)', 
            fontSize: '1.5rem', 
            fontWeight: '800', 
            letterSpacing: '-0.5px' 
          }}>
            {negocio?.nombre ? (
              negocio.nombre
            ) : (
              <>NEXUS<span style={{ color: 'var(--primary-green)' }}>Academy</span></>
            )}
          </h2>
        </Link>
      </div>
      
      <ul className={isAdmin ? 'admin-navbar-links' : 'public-navbar-links'} style={{ display: 'flex', listStyle: 'none', margin: 0, alignItems: 'center' }}>
        {isAdmin ? (
          // ENLACES DEL PANEL DE ADMINISTRACIÓN
          <>
            <li><Link to="/admin" style={getLinkStyle('/admin')}>Dashboard</Link></li>
            <li><Link to="/admin/cursos" style={getLinkStyle('/admin/cursos')}>Cursos</Link></li>
            <li><Link to="/admin/categorias" style={getLinkStyle('/admin/categorias')}>Categorías</Link></li>
            <li><Link to="/admin/promociones" style={getLinkStyle('/admin/promociones')}>Promociones</Link></li>
            <li><Link to="/admin/consultas" style={getLinkStyle('/admin/consultas')}>Consultas</Link></li>
            <li><Link to="/admin/negocio" style={getLinkStyle('/admin/negocio')}>Comercio</Link></li>
            <li><Link to="/admin/perfil" style={getLinkStyle('/admin/perfil')}>Mi Perfil</Link></li>
            <li>
              <button onClick={handleLogout} style={btnSecondaryStyle}>
                Cerrar Sesión
              </button>
            </li>
          </>
        ) : (
          // ENLACES DEL SITIO PÚBLICO 
          <>
            <li><Link to="/" aria-current={location.pathname === '/' ? 'page' : undefined}>Inicio</Link></li>
            <li><Link to="/cursos" aria-current={location.pathname === '/cursos' ? 'page' : undefined}>Catálogo</Link></li>
            <li><Link to="/contacto" aria-current={location.pathname === '/contacto' ? 'page' : undefined}>Contacto</Link></li>
            <li>
              <button onClick={() => navigate('/login')} className="public-button public-button-outline">
                Admin Login
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

const btnPrimaryStyle = {
  padding: '0.5rem 1.25rem',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: 'var(--primary-green)',
  border: '1px solid var(--primary-green)',
  borderRadius: '999px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const btnSecondaryStyle = {
  ...btnPrimaryStyle,
  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
  color: '#ef4444', 
  border: '1px solid #ef4444',
};