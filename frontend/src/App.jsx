import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Inicio from './components/Inicio';
import Catalogo from './components/Catalogo';
import Contacto from './components/Contacto';
import DetalleCurso from './components/DetalleCurso';

import AdminLayout from './components/AdminLayout';
import Dashboard from './components/Dashboard';
import GestionCursos from './components/GestionCursos';
import GestionCategorias from './components/GestionCategorias';
import GestionConsultas from './components/GestionConsultas';

import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Inicio />} />
          <Route path="/cursos" element={<Catalogo />} />
          <Route path="/cursos/:id" element={<DetalleCurso />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* Rutas Privadas Anidadas (Todo lo que empiece con /admin pasa por AdminLayout) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} /> {/* Ruta por defecto: /admin */}
            <Route path="cursos" element={<GestionCursos />} /> {/* /admin/cursos */}
            <Route path="categorias" element={<GestionCategorias />} /> {/* /admin/categorias */}
            <Route path="consultas" element={<GestionConsultas />} /> {/* /admin/consultas */}
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <>
      {/* Contenedor global de notificaciones */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#0a0a0a',
            border: '1px solid var(--primary-green)',
            color: 'var(--text-main)',
            fontFamily: 'Consolas, monospace',
            borderRadius: '4px'
          },
        }} 
      />
      
      {/* Acá sigue el resto de tu código actual (AppContainer, Navbar, Routes, etc.) */}
      <div style={appContainerStyle}>
         ...
      </div>
    </>
  );
}