import dayjs from 'dayjs';
import type { OrdenDetalle, OrdenProduccion, Producto, Tarima } from '../types/models';

export function formatOrderLabel(orden?: OrdenProduccion | null): string {
  if (!orden) {
    return 'Orden eliminada';
  }

  const year = orden.creadoEn ? dayjs(orden.creadoEn).format('YYYY') : '';
  return year ? `${orden.folio} / ${year}` : orden.folio;
}

export function formatProductLabel(
  producto?: Producto | null,
  options?: {
    includeKey?: boolean;
    includeClient?: boolean;
  },
): string {
  if (!producto) {
    return 'Producto sin asignar';
  }

  const parts: string[] = [];

  if (options?.includeKey && producto.clave) {
    parts.push(`[${producto.clave}]`);
  }

  parts.push(producto.nombre);
  parts.push(producto.presentacion);
  parts.push(producto.medidas);

  if (options?.includeClient && producto.cliente?.nombre) {
    parts.push(producto.cliente.nombre);
  }

  return parts.filter(Boolean).join(' | ');
}

export function formatOrderDetailLabel(detalle?: OrdenDetalle | null): string {
  if (!detalle) {
    return 'Relación no disponible';
  }

  return [
    formatOrderLabel(detalle.orden),
    formatProductLabel(detalle.producto, {
      includeKey: true,
      includeClient: true,
    }),
  ]
    .filter(Boolean)
    .join(' | ');
}

export function formatTarimaLabel(tarima?: Tarima | null): string {
  if (!tarima) {
    return 'Tarima no disponible';
  }

  return [
    `Tarima ${tarima.numero}`,
    tarima.ordenDetalle?.producto?.cliente?.nombre,
  ]
    .filter(Boolean)
    .join(' | ');
}
