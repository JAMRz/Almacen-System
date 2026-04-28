export type RolUsuario = "SUPERVISOR" | "OPERADOR" | "LECTURA";

export interface UsuarioSesion {
  id: string;
  user: string;
  rol: RolUsuario;
}

export interface LoginBody {
  user: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token?: string;
  usuario: UsuarioSesion;
}
