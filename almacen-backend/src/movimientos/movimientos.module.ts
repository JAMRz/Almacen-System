import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { ProductosModule } from '../productos/productos.module';
import { TarimasModule } from '../tarimas/tarimas.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { MovimientosService } from './movimientos.service';
import { MovimientosController } from './movimientos.controller';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movimiento]),
    ProductosModule,
    TarimasModule,
    UsuariosModule,
    InventarioModule,
  ],
  controllers: [MovimientosController],
  providers: [MovimientosService],
  exports: [MovimientosService],
})
export class MovimientosModule {}
