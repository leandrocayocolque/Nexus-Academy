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
import GestionPromociones from './components/GestionPromociones';

import { Toaster } from 'sonner';
import SesionProvider from './auth/SesionProvider';
import Login from './components/Login';
import Registro from './components/Registro';
import RecuperarContrasena from './components/RecuperarContrasena';
import RestablecerContrasena from './components/RestablecerContrasena';
import PerfilAdmin from './components/PerfilAdmin';

import { NegocioProvider } from './components/NegocioContext';
import ConfiguracionNegocio from './components/ConfiguracionNegocio';

export default function App() {
  return (
    <SesionProvider>
      <NegocioProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              border: '1px solid var(--border-control)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-body)',
              borderRadius: 'var(--radius-control)',
              boxShadow: 'var(--shadow-card)'
            },
          }}
        />

        <Navbar />
        <main>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Inicio />} />
            <Route path="/cursos" element={<Catalogo />} />
            <Route path="/cursos/:id" element={<DetalleCurso />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

            {/* Rutas Privadas */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} /> {/* Ruta por defecto: /admin */}
              <Route path="cursos" element={<GestionCursos />} /> {/* /admin/cursos */}
              <Route path="categorias" element={<GestionCategorias />} /> {/* /admin/categorias */}
              <Route path="promociones" element={<GestionPromociones />} />
              <Route path="consultas" element={<GestionConsultas />} /> {/* /admin/consultas */}
              <Route path="negocio" element={<ConfiguracionNegocio />} /> {/* /admin/negocio */}
              <Route path="perfil" element={<PerfilAdmin />} /> {/* /admin/perfil */}
            </Route>
          </Routes>
        </main>
      </NegocioProvider>
    </SesionProvider>
  );
}