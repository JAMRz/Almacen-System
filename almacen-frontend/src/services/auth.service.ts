import type { LoginBody, LoginResponse } from '../utils/auth';
import { api } from './api';

export async function login(body: LoginBody): Promise<LoginResponse> {
  return api.post('auth/login', { json: body }).json<LoginResponse>();
}