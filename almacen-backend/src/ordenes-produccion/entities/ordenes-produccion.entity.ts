// src/ordenes-produccion/entities/orden-produccion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { OrdenDetalle } from './orden-detalle.entity';

@Entity('ordenes_produccion')
export class OrdenProduccion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  folio!: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;

  @OneToMany(() => OrdenDetalle, (detalle) => detalle.orden, { cascade: true })
  detalles!: OrdenDetalle[];
}
