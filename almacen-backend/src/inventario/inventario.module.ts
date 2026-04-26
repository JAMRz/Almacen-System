import { Module } from '@nestjs/common';
import { Inventario } from './entities/inventario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from '../productos/productos.module';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { EntradaDiaria } from '../entradas-diarias/entities/entradas-diaria.entity';
import { Movimiento } from '../movimientos/entities/movimiento.entity';
import { Producto } from '../productos/entities/producto.entity';
import { DetalleTarima } from '../tarimas/entities/detalle-tarima.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventario, EntradaDiaria, Movimiento, Producto, DetalleTarima]), ProductosModule],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
