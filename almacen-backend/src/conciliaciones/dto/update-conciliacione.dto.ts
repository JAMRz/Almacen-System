import { PartialType } from '@nestjs/mapped-types';
import { CreateConciliacionDto } from './create-conciliacione.dto';

export class UpdateConciliacioneDto extends PartialType(
  CreateConciliacionDto,
) {}
