import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalUnidades!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalKg!: number;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn!: Date;
}
