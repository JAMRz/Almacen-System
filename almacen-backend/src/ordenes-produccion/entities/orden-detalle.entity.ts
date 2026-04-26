import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenProduccion } from './ordenes-produccion.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { Tarima } from 'src/tarimas/entities/tarima.entity';
import { EntradaDiaria } from 'src/entradas-diarias/entities/entradas-diaria.entity';
import { OneToMany } from 'typeorm';

@Entity('ordenes_detalle')
export class OrdenDetalle {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OrdenProduccion, (orden) => orden.detalles, { eager: false })
  @JoinColumn({ name: 'orden_id' })
  orden!: OrdenProduccion;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;

  @OneToMany(() => EntradaDiaria, (entrada) => entrada.ordenDetalle)
  entradas!: EntradaDiaria[];

  @OneToMany(() => Tarima, (tarima) => tarima.ordenDetalle)
  tarimas!: Tarima[];
}
