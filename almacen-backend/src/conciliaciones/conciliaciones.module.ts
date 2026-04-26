import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from '../productos/productos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ConciliacionesService } from './conciliaciones.service';
import { ConciliacionesController } from './conciliaciones.controller';
import { Conciliacion } from './entities/conciliacione.entity';
import { EntradaDiaria } from 'src/entradas-diarias/entities/entradas-diaria.entity';
import { Tarima } from 'src/tarimas/entities/tarima.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conciliacion, EntradaDiaria, Tarima]),
    ProductosModule,
    UsuariosModule,
  ],
  controllers: [ConciliacionesController],
  providers: [ConciliacionesService],
  exports: [ConciliacionesService],
})
export class ConciliacionesModule {}
