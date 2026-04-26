import { IsInt, IsPositive } from 'class-validator';

export class CreateTarimaDto {
  @IsInt()
  @IsPositive()
  numero: number;

  @IsInt()
  ordenDetalleId: number;
}

