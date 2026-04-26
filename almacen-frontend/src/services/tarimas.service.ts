import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { DetalleTarima, PaginatedResponse, Tarima } from '../types/models';

export interface CreateTarimaDto {
  numero: number;
  ordenDetalleId: number;
}

export interface CreateDetalleTarimaDto {
  pesoKg: number;
  tarimaId: number;
}

export async function getTarimas(params?: {
  productoId?: number;
  ordenId?: number;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Tarima>> {
  return getPaginated<Tarima>('tarimas', params);
}

export async function getTarimaById(id: number): Promise<Tarima> {
  return api.get(`tarimas/${id}`).json<Tarima>();
}

export async function createTarima(data: CreateTarimaDto): Promise<Tarima> {
  return api.post('tarimas', { json: data }).json<Tarima>();
}

export async function updateTarima(id: number, data: Partial<CreateTarimaDto>): Promise<Tarima> {
  return api.patch(`tarimas/${id}`, { json: data }).json<Tarima>();
}

export async function deleteTarima(id: number): Promise<void> {
  await requestVoid(api.delete(`tarimas/${id}`));
}

export async function addDetalleTarima(data: CreateDetalleTarimaDto): Promise<DetalleTarima> {
  return api.post('tarimas/detalle', { json: data }).json<DetalleTarima>();
}

export async function removeDetalleTarima(id: number): Promise<void> {
  await requestVoid(api.delete(`tarimas/detalle/${id}`));
}

export async function clearDetalleTarima(tarimaId: number): Promise<void> {
  await requestVoid(api.delete(`tarimas/${tarimaId}/detalle`));
}
