import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum RolUsuario {
  SUPERVISOR = 'SUPERVISOR',
  OPERADOR = 'OPERADOR',
  LECTURA = 'LECTURA',
}

@Entity('usuarios')
@Index('UQ_usuarios_user_activo', ['user'], {
  unique: true,
  where: '"eliminado:_en" IS NULL',
})
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user!: string;

  @Column({ select: false })
  password!: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.LECTURA })
  rol!: RolUsuario;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @DeleteDateColumn({ name: 'eliminado:_en' })
  eliminadoEn!: Date;
}
