import { RolUsuario } from '../entities/usuario.entity';

export class ResponseUsuarioDto {
  id!: string;
  user!: string;
  rol!: RolUsuario;
  creadoEn!: Date;
}
