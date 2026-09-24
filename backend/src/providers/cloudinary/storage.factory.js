import { ProveedorAlmacenamientoCloudinary } from './cloudinary.adapter.js';
import {
  ProveedorAlmacenamientoImagenesMemoria,
  ProveedorAlmacenamientoNoDisponible
} from './imageStorage.provider.js';

function configuracionCompleta(configuracion) {
  return Boolean(configuracion.cloudName && configuracion.apiKey && configuracion.apiSecret);
}

export function crearProveedorAlmacenamiento({
  configuracion,
  ambiente,
  registrador,
  cargarCloudinary = () => import('cloudinary')
}) {
  if (ambiente === 'test') return new ProveedorAlmacenamientoImagenesMemoria();
  if (!configuracionCompleta(configuracion)) return new ProveedorAlmacenamientoNoDisponible();

  let promesaCliente;
  const obtenerCliente = () => {
    if (!promesaCliente) {
      promesaCliente = cargarCloudinary().then((modulo) => {
        const cliente = modulo.v2 ?? modulo.default?.v2 ?? modulo.default;
        cliente.config({
          cloud_name: configuracion.cloudName,
          api_key: configuracion.apiKey,
          api_secret: configuracion.apiSecret,
          secure: true
        });
        return cliente;
      });
    }
    return promesaCliente;
  };

  return new ProveedorAlmacenamientoCloudinary({
    obtenerCliente,
    carpeta: configuracion.carpeta,
    registrador
  });
}
