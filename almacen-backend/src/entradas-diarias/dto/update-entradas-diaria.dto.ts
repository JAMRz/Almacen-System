import { PartialType } from '@nestjs/mapped-types';
import { CreateEntradaDiariaDto } from './create-entradas-diaria.dto';

export class UpdateEntradasDiariaDto extends PartialType(
  CreateEntradaDiariaDto,
) {}
