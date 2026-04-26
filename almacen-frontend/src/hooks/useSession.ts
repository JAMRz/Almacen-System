import { clearSession, getSessionUser, getToken } from '../utils/auth-storage';

export function useSession() {
  const token = getToken();
  const usuario = getSessionUser();

  return {
    token,
    usuario,
    isAuthenticated: Boolean(token),
    logout: clearSession,
  };
}