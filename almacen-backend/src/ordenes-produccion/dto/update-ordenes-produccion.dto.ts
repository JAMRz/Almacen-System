import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdenProduccionDto } from './create-ordenes-produccion.dto';

export class UpdateOrdenesProduccionDto extends PartialType(
  CreateOrdenProduccionDto,
) {}
