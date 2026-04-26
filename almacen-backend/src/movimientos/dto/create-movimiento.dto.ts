import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TipoMovimiento } from '../entities/movimiento.entity';
import { UnidadEntrega } from '../../productos/entities/producto.entity';

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento)
  tipo!: TipoMovimiento;

  @IsNumber()
  @IsPositive()
  unidades!: number;

  @IsNumber()
  @IsPositive()
  kg!: number;

  @IsEnum(UnidadEntrega)
  unidadFacturacion!: UnidadEntrega;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsInt()
  productoId!: number;

  @IsInt()
  @IsOptional()
  tarimaId?: number;
}
