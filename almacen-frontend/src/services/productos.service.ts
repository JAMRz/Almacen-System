import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { PaginatedResponse, Producto, TipoMaterial, UnidadEntrega } from '../types/models';

export interface CreateProductoDto {
  nombre: string;
  presentacion: string;
  medidas: string;
  tipoMaterial: TipoMaterial;
  unidadEntrega: UnidadEntrega;
  clienteId: number;
}

export async function getProductos(params?: {
  clienteId?: number;
  nombre?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Producto>> {
  return getPaginated<Producto>('productos', params);
}

export async function getProductoById(id: number): Promise<Producto> {
  return api.get(`productos/${id}`).json<Producto>();
}

export async function createProducto(data: CreateProductoDto): Promise<Producto> {
  return api.post('productos', { json: data }).json<Producto>();
}

export async function updateProducto(id: number, data: Partial<CreateProductoDto>): Promise<Producto> {
  return api.patch(`productos/${id}`, { json: data }).json<Producto>();
}

export async function deleteProducto(id: number): Promise<void> {
  await requestVoid(api.delete(`productos/${id}`));
}
