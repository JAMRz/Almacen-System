import { Cliente } from 'src/clientes/entities/cliente.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TipoMaterial {
  BOBINA = 'BOBINA',
  BOLSA = 'BOLSA',
  TURBOPACK = 'TURBOPACK',
  CINTA = 'CINTA',
  CAMISETA = 'CAMISETA',
  PINHOLL = 'PINHOLL',
  RACIMO = 'RACIMO',
  OTRO = 'OTRO',
}

export enum UnidadEntrega {
  KILOGRAMOS = 'KILOGRAMOS',
  UNIDADES = 'UNIDADES',
  PAQUETES = 'PAQUETES',
}

@Entity('productos')
@Index('UQ_productos_clave_activa', ['clave'], {
  unique: true,
  where: '"eliminado_en" IS NULL',
})
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  clave!: string;

  @Column()
  nombre!: string;

  @Column()
  presentacion!: string;

  @Column({ nullable: true })
  medidas!: string;

  @Column({
    type: 'enum',
    enum: TipoMaterial,
  })
  tipoMaterial!: TipoMaterial;

  @Column({
    type: 'enum',
    enum: UnidadEntrega,
  })
  unidadEntrega!: UnidadEntrega;

  @ManyToOne(() => Cliente, (cliente) => cliente.productos)
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado_en' })
  eliminadoEn!: Date;
}
