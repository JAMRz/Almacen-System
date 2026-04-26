import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { EntradaDiaria, PaginatedResponse } from '../types/models';

import type { TurnoEnum } from '../types/models';

export interface CreateEntradaDto {
  pesoKg: number;
  fecha: string;
  ordenDetalleId: number;
  turno: TurnoEnum;
}

export async function getEntradas(params?: {
  ordenId?: number;
  fecha?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<EntradaDiaria>> {
  return getPaginated<EntradaDiaria>('entradas-diarias', params);
}

export async function getEntradaById(id: number): Promise<EntradaDiaria> {
  return api.get(`entradas-diarias/${id}`).json<EntradaDiaria>();
}

export async function createEntrada(data: CreateEntradaDto): Promise<EntradaDiaria> {
  return api.post('entradas-diarias', { json: data }).json<EntradaDiaria>();
}

export async function updateEntrada(id: number, data: Partial<CreateEntradaDto>): Promise<EntradaDiaria> {
  return api.patch(`entradas-diarias/${id}`, { json: data }).json<EntradaDiaria>();
}

export async function deleteEntrada(id: number): Promise<void> {
  await requestVoid(api.delete(`entradas-diarias/${id}`));
}
