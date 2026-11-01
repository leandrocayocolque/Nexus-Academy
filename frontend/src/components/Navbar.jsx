import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Nos permite saber en qué ruta estamos para iluminar el menú
  
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    setIsAdmin(false);
    navigate('/');
  };

  // Función auxiliar para aplicar estilos dinámicos a los enlaces según la ruta actual
  const getLinkStyle = (path) => ({
    color: location.pathname === path ? 'var(--text-main)' : '#9ca3af',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  });

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1.25rem 4rem', 
      backgroundColor: 'rgba(10, 10, 10, 0.75)', // Fondo oscuro con transparencia
      backdropFilter: 'blur(12px)', // Desenfoque estilo cristal
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100 // Asegura que siempre esté por encima del resto del contenido
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
            NEXUS<span style={{ color: 'var(--primary-green)' }}>Academy</span>
          </h2>
        </Link>
      </div>
      
      <ul style={{ display: 'flex', listStyle: 'none', gap: '2.5rem', margin: 0, alignItems: 'center' }}>
        {isAdmin ? (
          // --- ENLACES DEL PANEL DE ADMINISTRACIÓN ---
          <>
            <li><Link to="/admin" style={getLinkStyle('/admin')}>Dashboard</Link></li>
            <li><Link to="/admin/cursos" style={getLinkStyle('/admin/cursos')}>Cursos</Link></li>
            <li><Link to="/admin/categorias" style={getLinkStyle('/admin/categorias')}>Categorías</Link></li>
            <li><Link to="/admin/consultas" style={getLinkStyle('/admin/consultas')}>Consultas</Link></li>
            <li>
              <button onClick={handleLogout} style={btnSecondaryStyle}>
                Cerrar Sesión
              </button>
            </li>
          </>
        ) : (
          // --- ENLACES DEL SITIO PÚBLICO ---
          <>
            <li><Link to="/" style={getLinkStyle('/')}>Inicio</Link></li>
            <li><Link to="/cursos" style={getLinkStyle('/cursos')}>Catálogo</Link></li>
            <li><Link to="/contacto" style={getLinkStyle('/contacto')}>Contacto</Link></li>
            <li>
              <button onClick={() => setIsAdmin(true)} style={btnPrimaryStyle}>
                Admin Login
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

// Estilos extraídos para mantener el HTML más limpio
const btnPrimaryStyle = {
  padding: '0.5rem 1.25rem',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: 'var(--primary-green)',
  border: '1px solid var(--primary-green)',
  borderRadius: '999px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const btnSecondaryStyle = {
  ...btnPrimaryStyle,
  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
  color: '#ef4444', 
  border: '1px solid #ef4444',
};