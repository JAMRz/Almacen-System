import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateDetalleTarimaDto {
  @IsNumber()
  @IsPositive()
  pesoKg: number;

  @IsInt()
  tarimaId: number;
}
