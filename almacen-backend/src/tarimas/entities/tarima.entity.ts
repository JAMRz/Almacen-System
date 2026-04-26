import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { OrdenDetalle } from 'src/ordenes-produccion/entities/orden-detalle.entity';
import { DetalleTarima } from './detalle-tarima.entity';

@Entity('tarimas')
export class Tarima {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalUnidades!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalKg!: number;

  @ManyToOne(() => OrdenDetalle, { eager: false })
  @JoinColumn({ name: 'orden_detalle_id' })
  ordenDetalle!: OrdenDetalle;

  @OneToMany(() => DetalleTarima, (detalle) => detalle.tarima)
  detalles!: DetalleTarima[];

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;
}
