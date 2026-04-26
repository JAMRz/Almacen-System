import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { Movimiento, PaginatedResponse, TipoMovimiento, UnidadEntrega } from '../types/models';

export interface CreateMovimientoDto {
  tipo: TipoMovimiento;
  unidades: number;
  kg: number;
  unidadFacturacion: UnidadEntrega;
  notas?: string;
  productoId: number;
  tarimaId?: number | null;
}

export async function getMovimientos(params?: {
  tipo?: TipoMovimiento;
  productoId?: number;
  fecha?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Movimiento>> {
  return getPaginated<Movimiento>('movimientos', params);
}

export async function getMovimientoById(id: number): Promise<Movimiento> {
  return api.get(`movimientos/${id}`).json<Movimiento>();
}

export async function createMovimiento(data: CreateMovimientoDto): Promise<Movimiento> {
  return api.post('movimientos', { json: data }).json<Movimiento>();
}

export async function updateMovimiento(id: number, data: Partial<CreateMovimientoDto>): Promise<Movimiento> {
  return api.patch(`movimientos/${id}`, { json: data }).json<Movimiento>();
}

export async function deleteMovimiento(id: number): Promise<void> {
  await requestVoid(api.delete(`movimientos/${id}`));
}
