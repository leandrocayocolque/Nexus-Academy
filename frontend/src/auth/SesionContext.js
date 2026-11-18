import { createContext, useContext } from 'react';

export const SesionContext = createContext(null);

// Consumidores admin: const { academia, solicitar, usuario, logout } = useSesion();
// academia conserva la inyección; solicitar permite agregar endpoints en T4/T5.
export function useSesion() {
  const sesion = useContext(SesionContext);
  if (!sesion) throw new Error('useSesion requiere SesionProvider.');
  return sesion;
}
