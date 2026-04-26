import {
  IsEnum,
  IsInt,
  MinLength,
  IsString,
} from 'class-validator';
import { TipoMaterial, UnidadEntrega } from '../entities/producto.entity';

export class CreateProductoDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  presentacion: string;

  @IsString()
  @MinLength(1)
  medidas: string;

  @IsEnum(TipoMaterial)
  tipoMaterial: TipoMaterial;

  @IsEnum(UnidadEntrega)
  unidadEntrega: UnidadEntrega;

  @IsInt()
  clienteId: number;
}
