import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from '../productos/productos.module';
import { OrdenesProduccionService } from './ordenes-produccion.service';
import { OrdenesProduccionController } from './ordenes-produccion.controller';
import { OrdenProduccion } from './entities/ordenes-produccion.entity';
import { OrdenDetalle } from './entities/orden-detalle.entity';
import { Tarima } from '../tarimas/entities/tarima.entity';
import { EntradaDiaria } from '../entradas-diarias/entities/entradas-diaria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenProduccion,
      OrdenDetalle,
      Tarima,
      EntradaDiaria,
    ]),
    ProductosModule,
  ],
  controllers: [OrdenesProduccionController],
  providers: [OrdenesProduccionService],
  exports: [OrdenesProduccionService],
})
export class OrdenesProduccionModule {}
