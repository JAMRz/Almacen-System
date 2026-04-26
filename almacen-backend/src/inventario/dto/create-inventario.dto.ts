import { IsInt } from 'class-validator';

export class CreateInventarioDto {
  @IsInt()
  productoId: number;
}
