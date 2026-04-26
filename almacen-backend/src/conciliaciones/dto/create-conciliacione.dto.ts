import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConciliacionDto {
  @IsNumber()
  pesoFisico!: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsInt()
  productoId!: number;
}
