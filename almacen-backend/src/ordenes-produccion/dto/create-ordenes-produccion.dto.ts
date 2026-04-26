import { IsArray, IsInt, IsString } from 'class-validator';

export class CreateOrdenProduccionDto {
  @IsString()
  folio: string;

  @IsArray()
  @IsInt({ each: true })
  productoIds: number[];
}

