import { useState, useSyncExternalStore } from 'react';
import { crearSesion } from './sesion.js';
import { SesionContext } from './SesionContext.js';

export default function SesionProvider({ children }) {
  const [sesion] = useState(() => crearSesion());
  const snapshot = useSyncExternalStore(sesion.subscribe, sesion.getSnapshot);
  return (
    <SesionContext.Provider value={{ ...snapshot, login: sesion.login, logout: sesion.logout,
      academia: sesion.academia, solicitar: sesion.solicitar }}>
      {children}
    </SesionContext.Provider>
  );
}
