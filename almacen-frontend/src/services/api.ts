import ky from 'ky';
import { clearSession, getToken } from '../utils/auth-storage';

export const api = ky.create({
  prefix: '/api',
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getToken();

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      ({ response }) => {
        // Only clear session and redirect on 401 if NOT on the login page
        // (the login endpoint itself returns 401 for invalid credentials)
        if (response.status === 401 && window.location.pathname !== '/login') {
          clearSession();
          window.location.href = '/login';
        }
      },
    ],
  },
});


