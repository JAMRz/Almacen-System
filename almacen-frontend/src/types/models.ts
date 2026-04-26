export const RolUsuarioList = ['SUPERVISOR', 'OPERADOR', 'LECTURA'] as const;
export type RolUsuario = typeof RolUsuarioList[number];

export const TipoMaterialList = ['BOBINA', 'BOLSA', 'TURBOPACK', 'CINTA', 'CAMISETA', 'PINHOLL', 'RACIMO', 'OTRO'] as const;
export type TipoMaterial = typeof TipoMaterialList[number];

export const UnidadEntregaList = ['KILOGRAMOS', 'UNIDADES', 'PAQUETES'] as const;
export type UnidadEntrega = typeof UnidadEntregaList[number];

export const TurnoEnumList = ['PRIMERO', 'SEGUNDO', 'TERCERO'] as const;
export type TurnoEnum = typeof TurnoEnumList[number];

export const TipoMovimientoList = ['ENTRADA', 'SALIDA'] as const;
export type TipoMovimiento = typeof TipoMovimientoList[number];

export const EstadoConciliacionList = ['PENDIENTE', 'CONCILIADO', 'DISCREPANCIA'] as const;
export type EstadoConciliacion = typeof EstadoConciliacionList[number];

export interface Usuario {
  id: string; // UUID
  user: string;
  rol: RolUsuario;
  creadoEn: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  creadoEn: string;
}

export interface Producto {
  id: number;
  clave: string;
  nombre: string;
  presentacion: string;
  medidas: string;
  tipoMaterial: TipoMaterial;
  unidadEntrega: UnidadEntrega;
  cliente: Cliente | null;
  creadoEn: string;
}

export interface OrdenProduccion {
  id: number;
  folio: string;
  detalles?: OrdenDetalle[];
  creadoEn: string;
}

export interface OrdenDetalle {
  id: number;
  orden: OrdenProduccion | null;
  producto: Producto | null;
  creadoEn: string;
}

export interface EntradaDiaria {
  id: number;
  pesoKg: number;
  fecha: string;
  turno: TurnoEnum;
  ordenDetalle: OrdenDetalle | null;
  usuario: { id: string; user: string } | null;
  creadoEn: string;
}

export interface Tarima {
  id: number;
  numero: number;
  totalUnidades: number;
  totalKg: number;
  ordenDetalle: OrdenDetalle | null;
  detalles: DetalleTarima[];
  creadoEn: string;
}

export interface DetalleTarima {
  id: number;
  pesoKg: number;
  creadoEn: string;
}

export interface Inventario {
  id: number;
  totalUnidades: number;
  totalKg: number;
  producto: Producto;
  actualizadoEn: string;
  sinStock: boolean;
}

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  unidades: number;
  kg: number;
  unidadFacturacion: UnidadEntrega;
  notas?: string;
  producto: Producto | null;
  tarima?: Tarima | null;
  usuario: { id: string; user: string } | null;
  creadoEn: string;
}

export interface Conciliacion {
  id: number;
  fecha: string;
  pesoEntradas: number;
  pesoTarimas: number;
  pesoFisico: number;
  diferenciaLibretas: number;
  diferenciaFisico: number;
  estado: EstadoConciliacion;
  notas?: string;
  producto: Producto | null;
  usuario: { id: string; user: string } | null;
  creadoEn: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
