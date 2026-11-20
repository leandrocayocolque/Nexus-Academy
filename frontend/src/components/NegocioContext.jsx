import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { academia } from '../api/academia.js';

const NegocioContext = createContext(null);

export function NegocioProvider({ children }) {
  const [negocio, setNegocio] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargarNegocio = useCallback(async (signal) => {
    try {
      const datos = await academia.obtenerNegocio({ signal });
      setNegocio(datos);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('No se pudo cargar la información del negocio:', error);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    recargarNegocio(controller.signal);
    return () => controller.abort();
  }, [recargarNegocio]);

  return (
    <NegocioContext.Provider value={{ negocio, setNegocio, cargando, recargarNegocio }}>
      {children}
    </NegocioContext.Provider>
  );
}

export function useNegocio() {
  const ctx = useContext(NegocioContext);
  if (!ctx) throw new Error('useNegocio debe usarse dentro de NegocioProvider');
  return ctx;
}