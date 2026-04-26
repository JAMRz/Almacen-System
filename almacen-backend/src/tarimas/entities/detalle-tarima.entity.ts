import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tarima } from './tarima.entity';

@Entity('detalle_tarima')
export class DetalleTarima {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  pesoKg!: number;

  @ManyToOne(() => Tarima, (tarima) => tarima.detalles)
  @JoinColumn({ name: 'tarima_id' })
  tarima!: Tarima;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;
}
