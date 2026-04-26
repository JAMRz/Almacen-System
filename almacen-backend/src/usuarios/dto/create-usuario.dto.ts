import { IsEnum, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @IsString()
  user!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(RolUsuario)
  rol!: RolUsuario;
}
