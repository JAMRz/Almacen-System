import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { ProductosModule } from './productos/productos.module';
import { OrdenesProduccionModule } from './ordenes-produccion/ordenes-produccion.module';
import { EntradasDiariasModule } from './entradas-diarias/entradas-diarias.module';
import { TarimasModule } from './tarimas/tarimas.module';
import { ConciliacionesModule } from './conciliaciones/conciliaciones.module';
import { InventarioModule } from './inventario/inventario.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

   TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const databaseUrl = config.get<string>('DATABASE_URL');

    return {
      type: 'postgres',
      ...(databaseUrl
        ? {
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: config.get<string>('DATABASE_HOST'),
            port: Number(config.get<string>('DATABASE_PORT')),
            username: config.get<string>('DATABASE_USER'),
            password: config.get<string>('DATABASE_PASSWORD'),
            database: config.get<string>('DATABASE_NAME'),
          }),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    };
  },
}),

    UsuariosModule,

    ClientesModule,

    ProductosModule,

    OrdenesProduccionModule,

    EntradasDiariasModule,

    TarimasModule,

    ConciliacionesModule,

    InventarioModule,

    MovimientosModule,

    AuthModule,
  ],
})
export class AppModule {}
