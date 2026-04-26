import type { UsuarioSesion } from "./auth";

const TOKEN_KEY = 'access_token';
const USER_KEY = 'usuario';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, usuario: UsuarioSesion) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSessionUser(): UsuarioSesion | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}