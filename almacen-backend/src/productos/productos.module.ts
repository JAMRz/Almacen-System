import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { ClientesModule } from '../clientes/clientes.module';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { OrdenDetalle } from '../ordenes-produccion/entities/orden-detalle.entity';
import { Movimiento } from '../movimientos/entities/movimiento.entity';
import { Conciliacion } from '../conciliaciones/entities/conciliacione.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      OrdenDetalle,
      Movimiento,
      Conciliacion,
    ]),
    ClientesModule,
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
