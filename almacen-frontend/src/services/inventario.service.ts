import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { Inventario, PaginatedResponse } from '../types/models';

export interface CreateInventarioDto {
  productoId: number;
}

export async function getInventarios(): Promise<PaginatedResponse<Inventario>> {
  return getPaginated<Inventario>('inventario');
}

export async function getInventarioById(id: number): Promise<Inventario> {
  return api.get(`inventario/${id}`).json<Inventario>();
}

export async function getInventarioByProducto(productoId: number): Promise<Inventario> {
  return api.get(`inventario/producto/${productoId}`).json<Inventario>();
}

export async function createInventario(data: CreateInventarioDto): Promise<Inventario> {
  return api.post('inventario', { json: data }).json<Inventario>();
}

export async function updateInventario(id: number, data: Partial<CreateInventarioDto>): Promise<Inventario> {
  return api.patch(`inventario/${id}`, { json: data }).json<Inventario>();
}

export async function deleteInventario(id: number): Promise<void> {
  await requestVoid(api.delete(`inventario/${id}`));
}
