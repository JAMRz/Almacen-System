import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum EstadoConciliacion {
  PENDIENTE = 'PENDIENTE',
  CONCILIADO = 'CONCILIADO',
  DISCREPANCIA = 'DISCREPANCIA',
}

@Entity('conciliaciones')
export class Conciliacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  pesoEntradas!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  pesoTarimas!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  pesoFisico!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  diferenciaLibretas!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  diferenciaFisico!: number;

  @Column({
    type: 'enum',
    enum: EstadoConciliacion,
    default: EstadoConciliacion.PENDIENTE,
  })
  estado!: EstadoConciliacion;

  @Column({ nullable: true })
  notas!: string;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;
}
