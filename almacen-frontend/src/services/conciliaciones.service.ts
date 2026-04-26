import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { Conciliacion, EstadoConciliacion, PaginatedResponse } from '../types/models';

export interface CreateConciliacionDto {
  pesoFisico: number;
  notas?: string;
  productoId: number;
}

export async function getConciliaciones(params?: {
  productoId?: number;
  estado?: EstadoConciliacion;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Conciliacion>> {
  return getPaginated<Conciliacion>('conciliaciones', params);
}

export async function getConciliacionById(id: number): Promise<Conciliacion> {
  return api.get(`conciliaciones/${id}`).json<Conciliacion>();
}

export async function createConciliacion(data: CreateConciliacionDto): Promise<Conciliacion> {
  return api.post('conciliaciones', { json: data }).json<Conciliacion>();
}

export async function updateConciliacion(id: number, data: { pesoFisico?: number; notas?: string }): Promise<Conciliacion> {
  return api.patch(`conciliaciones/${id}`, { json: data }).json<Conciliacion>();
}

export async function deleteConciliacion(id: number): Promise<void> {
  await requestVoid(api.delete(`conciliaciones/${id}`));
}
