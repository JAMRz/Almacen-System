import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { TurnoEnum } from 'src/entradas-diarias/entities/entradas-diaria.entity';
import { TipoMovimiento } from 'src/movimientos/entities/movimiento.entity';
import { EstadoConciliacion } from 'src/conciliaciones/entities/conciliacione.entity';

export class FiltrosProductoDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  clienteId?: number;

  @IsOptional()
  @IsString()
  nombre?: string;
}

export class FiltrosOrdenDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productoId?: number;


  @IsOptional()
  @IsString()
  folio?: string;
}

export class FiltrosEntradaDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  ordenId?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsEnum(TurnoEnum)
  turno?: TurnoEnum;
}

export class FiltrosTarimaDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productoId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  ordenId?: number;
}

export class FiltrosMovimientoDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TipoMovimiento)
  tipo?: TipoMovimiento;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productoId?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class FiltrosConciliacionDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productoId?: number;

  @IsOptional()
  @IsEnum(EstadoConciliacion)
  estado?: EstadoConciliacion;
}
