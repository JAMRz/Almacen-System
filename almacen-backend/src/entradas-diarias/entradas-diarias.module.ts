import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdenesProduccionModule } from '../ordenes-produccion/ordenes-produccion.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EntradasDiariasService } from './entradas-diarias.service';
import { EntradasDiariasController } from './entradas-diarias.controller';
import { EntradaDiaria } from './entities/entradas-diaria.entity';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntradaDiaria]),
    OrdenesProduccionModule,
    UsuariosModule,
    InventarioModule,
  ],
  controllers: [EntradasDiariasController],
  providers: [EntradasDiariasService],
  exports: [EntradasDiariasService],
})
export class EntradasDiariasModule {}
