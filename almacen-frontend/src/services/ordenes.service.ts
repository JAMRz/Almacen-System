import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { OrdenProduccion, PaginatedResponse, OrdenDetalle } from '../types/models';

export interface CreateOrdenDto {
  folio: string;
  productoIds: number[];
}

export async function getOrdenes(params?: {
  productoId?: number;
  folio?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<OrdenProduccion>> {
  return getPaginated<OrdenProduccion>('ordenes-produccion', params);
}

export async function getOrdenDetalles(): Promise<OrdenDetalle[]> {
  return api.get('ordenes-produccion/detalles').json<OrdenDetalle[]>();
}

export async function getOrdenById(id: number): Promise<OrdenProduccion> {
  return api.get(`ordenes-produccion/${id}`).json<OrdenProduccion>();
}

export async function createOrden(data: CreateOrdenDto): Promise<OrdenProduccion> {
  return api.post('ordenes-produccion', { json: data }).json<OrdenProduccion>();
}

export async function updateOrden(id: number, data: Partial<CreateOrdenDto>): Promise<OrdenProduccion> {
  return api.patch(`ordenes-produccion/${id}`, { json: data }).json<OrdenProduccion>();
}

export async function deleteOrden(id: number): Promise<void> {
  await requestVoid(api.delete(`ordenes-produccion/${id}`));
}
