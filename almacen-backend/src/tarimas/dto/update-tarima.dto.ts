import { PartialType } from '@nestjs/mapped-types';
import { CreateTarimaDto } from './create-tarima.dto';

export class UpdateTarimaDto extends PartialType(CreateTarimaDto) {}
