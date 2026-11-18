export class ErrorApi extends Error {
  constructor(message, { status = 0, code = 'ERROR_API', detalles } = {}) {
    super(message);
    this.name = 'ErrorApi';
    this.status = status;
    this.code = code;
    this.detalles = detalles;
  }
}

// La URL configurada incluye el prefijo de la API (por ejemplo, /api).
// No se presupone ningún servidor de producción ni se requiere Vite en Node.
export function crearCliente({
  baseUrl = import.meta.env?.VITE_API_URL,
  fetchImpl = globalThis.fetch,
  getToken = () => null,
  onUnauthorized,
} = {}) {
  return async function solicitar(path, {
    method = 'GET', query, body, headers: initialHeaders, signal,
  } = {}) {
    if (!baseUrl?.trim()) {
      throw new ErrorApi('Falta configurar VITE_API_URL para conectar con la academia.', {
        code: 'CONFIGURACION_API',
      });
    }
    signal?.throwIfAborted();
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
    const consulta = params.toString();
    const url = `${baseUrl.trim().replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}${consulta ? `?${consulta}` : ''}`;
    const headers = new Headers(initialHeaders);
    headers.set('Accept', 'application/json');
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let payload = body;
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      headers.delete('Content-Type');
    } else if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
      payload = JSON.stringify(body);
    }

    let response;
    let data;
    try {
      response = await fetchImpl(url, { method, headers, body: payload, signal });
      if (response.status !== 204) {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (response.ok) {
            throw new ErrorApi('La respuesta del servidor no es válida.', {
              status: response.status, code: 'RESPUESTA_INVALIDA',
            });
          }
        }
      }
      signal?.throwIfAborted();
    } catch (error) {
      if (signal?.aborted) signal.throwIfAborted();
      if (error.name === 'AbortError' || error instanceof ErrorApi) throw error;
      throw new ErrorApi('No se pudo conectar con la academia. Intentá nuevamente.', {
        code: 'ERROR_RED',
      });
    }
    if (!response.ok) {
      const error = new ErrorApi(
        data?.error?.mensaje || `No se pudo completar la solicitud (HTTP ${response.status}).`,
        { status: response.status, code: data?.error?.codigo || 'ERROR_HTTP', detalles: data?.error?.detalles },
      );
      if (response.status === 401) onUnauthorized?.(error);
      throw error;
    }
    return data ?? null;
  };
}

export const cliente = crearCliente();
