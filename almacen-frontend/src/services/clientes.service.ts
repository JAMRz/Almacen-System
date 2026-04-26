import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { Cliente, PaginatedResponse } from '../types/models';

export async function getClientes(): Promise<PaginatedResponse<Cliente>> {
  return getPaginated<Cliente>('clientes');
}

export async function getClienteById(id: number): Promise<Cliente> {
  return api.get(`clientes/${id}`).json<Cliente>();
}

export async function createCliente(data: { nombre: string }): Promise<Cliente> {
  return api.post('clientes', { json: data }).json<Cliente>();
}

export async function updateCliente(id: number, data: { nombre: string }): Promise<Cliente> {
  return api.patch(`clientes/${id}`, { json: data }).json<Cliente>();
}

export async function deleteCliente(id: number): Promise<void> {
  await requestVoid(api.delete(`clientes/${id}`));
}
