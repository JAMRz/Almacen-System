import ky from "ky";
import { clearSession, getToken } from "../utils/auth-storage";

const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

if (!apiUrl) {
  throw new Error("VITE_API_URL is required to connect to the backend API.");
}

export const api = ky.create({
  prefix: apiUrl,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getToken();

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      ({ response }) => {
        // Only clear session and redirect on 401 if NOT on the login page
        // (the login endpoint itself returns 401 for invalid credentials)
        if (response.status === 401 && window.location.pathname !== "/login") {
          clearSession();
          window.location.href = "/login";
        }
      },
    ],
  },
});
