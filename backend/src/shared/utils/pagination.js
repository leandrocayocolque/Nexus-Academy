export function normalizarPaginacion({ pagina = 1, limite = 10 } = {}) {
  const paginaSegura = Math.max(Math.trunc(Number(pagina)) || 1, 1);
  const limiteSeguro = Math.min(Math.max(Math.trunc(Number(limite)) || 10, 1), 100);

  return {
    pagina: paginaSegura,
    limite: limiteSeguro,
    omitir: (paginaSegura - 1) * limiteSeguro
  };
}

export function crearResultadoPaginado({ datos, total, pagina, limite }) {
  return {
    datos,
    paginacion: {
      total,
      pagina,
      limite,
      paginasTotales: Math.ceil(total / limite)
    }
  };
}

export const getPagination = ({ page, limit, pagina, limite } = {}) => {
  const normalizada = normalizarPaginacion({ pagina: pagina ?? page, limite: limite ?? limit });
  return {
    page: normalizada.pagina,
    limit: normalizada.limite,
    skip: normalizada.omitir
  };
};
