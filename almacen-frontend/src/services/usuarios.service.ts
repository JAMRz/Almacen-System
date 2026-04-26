import { api } from './api';
import { getPaginated, requestVoid } from './helpers';
import type { PaginatedResponse, RolUsuario, Usuario } from '../types/models';

export interface CreateUsuarioDto {
  user: string;
  password?: string;
  rol: RolUsuario;
}

export async function getUsuarios(): Promise<PaginatedResponse<Usuario>> {
  return getPaginated<Usuario>('usuarios');
}

export async function getUsuarioById(id: string): Promise<Usuario> {
  return api.get(`usuarios/${id}`).json<Usuario>();
}

export async function createUsuario(data: CreateUsuarioDto): Promise<Usuario> {
  return api.post('usuarios', { json: data }).json<Usuario>();
}

export async function updateUsuario(id: string, data: Partial<CreateUsuarioDto>): Promise<Usuario> {
  return api.patch(`usuarios/${id}`, { json: data }).json<Usuario>();
}

export async function deleteUsuario(id: string): Promise<void> {
  await requestVoid(api.delete(`usuarios/${id}`));
}
