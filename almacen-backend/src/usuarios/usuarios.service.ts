import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ResponseUsuarioDto } from './dto/response-usuario.dto';
import { PaginationDto } from 'src/common/pagination.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

 async create(createUsuarioDto: CreateUsuarioDto): Promise<ResponseUsuarioDto> {
  const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);
  const usuario = this.usuarioRepo.create({
    ...createUsuarioDto,
    password: hashedPassword,
  });

  try {
    await this.usuarioRepo.save(usuario);
  } catch (error) {
    if (error?.driverError?.code === '23505') {
      throw new ConflictException('El usuario ya existe');
    }
    throw error;
  }

  return this.findOne(usuario.id);
}

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const [data, total] = await this.usuarioRepo.findAndCount({
      take: limit,
      skip: offset,
    });
    return { data, total, limit, offset };
  }

  async findOne(id: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado.`);
    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<ResponseUsuarioDto> {
  const usuario = await this.findOne(id);
  if (updateUsuarioDto.password) {
    updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, 10);
  }

  try {
    await this.usuarioRepo.save({ ...usuario, ...updateUsuarioDto });
  } catch (error) {
    if (error?.driverError?.code === '23505') {
      throw new ConflictException('El usuario ya existe');
    }
    throw error;
  }

  return this.findOne(id);
}

  async remove(id: string) {
    const usuario = await this.findOne(id);
    await this.usuarioRepo.softDelete(usuario.id);
  }

  async findByUser(user: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.user = :user', { user })
      .getOne();
    if (!usuario) throw new NotFoundException(`Usuario ${user} no encontrado`);
    return usuario;
  }
}
