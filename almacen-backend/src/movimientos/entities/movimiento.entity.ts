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
import { Tarima } from '../../tarimas/entities/tarima.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { UnidadEntrega } from '../../productos/entities/producto.entity';

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: TipoMovimiento,
  })
  tipo!: TipoMovimiento;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  unidades!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  kg!: number;

  @Column({
    type: 'enum',
    enum: UnidadEntrega,
  })
  unidadFacturacion!: UnidadEntrega;

  @Column({ nullable: true })
  notas!: string;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @ManyToOne(() => Tarima, { eager: false, nullable: true })
  @JoinColumn({ name: 'tarima_id' })
  tarima!: Tarima | null;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;
}
