import { IsDateString, IsEnum, IsInt, IsNumber, IsPositive } from 'class-validator';
import { TurnoEnum } from '../entities/entradas-diaria.entity';

export class CreateEntradaDiariaDto {
  @IsNumber()
  @IsPositive()
  pesoKg!: number;

  @IsDateString()
  fecha!: string;

  @IsInt()
  ordenDetalleId!: number;

  @IsEnum(TurnoEnum)
  turno!: TurnoEnum;
}

