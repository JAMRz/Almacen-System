import { Producto } from 'src/productos/entities/producto.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('clientes')
@Index('UQ_clientes_nombre_activo', ['nombre'], {
  unique: true,
  where: '"eliminado_en" IS NULL',
})
export class Cliente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  EliminadoEn!: Date;

  @OneToMany(() => Producto, (producto) => producto.cliente)
  productos!: Producto[];
}
