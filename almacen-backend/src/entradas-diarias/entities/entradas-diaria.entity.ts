import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Usuario } from '../../usuarios/entities/usuario.entity';
import { OrdenDetalle } from 'src/ordenes-produccion/entities/orden-detalle.entity';

export enum TurnoEnum {
  PRIMERO = 'PRIMERO',
  SEGUNDO = 'SEGUNDO',
  TERCERO = 'TERCERO',
}

@Entity('entradas_diarias')
export class EntradaDiaria {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  pesoKg!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({
    type: 'enum',
    enum: TurnoEnum,
    default: TurnoEnum.PRIMERO,
  })
  turno!: TurnoEnum;

  @ManyToOne(() => OrdenDetalle, { eager: false })
  @JoinColumn({ name: 'orden_detalle_id' })
  ordenDetalle!: OrdenDetalle;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;
}
