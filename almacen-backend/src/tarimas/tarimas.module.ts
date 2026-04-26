import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarima } from './entities/tarima.entity';
import { DetalleTarima } from './entities/detalle-tarima.entity';
import { OrdenesProduccionModule } from '../ordenes-produccion/ordenes-produccion.module';
import { ProductosModule } from '../productos/productos.module';
import { TarimasService } from './tarimas.service';
import { TarimasController } from './tarimas.controller';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tarima, DetalleTarima]),
    OrdenesProduccionModule,
    ProductosModule,
    InventarioModule,
  ],
  controllers: [TarimasController],
  providers: [TarimasService],
  exports: [TarimasService],
})
export class TarimasModule {}
