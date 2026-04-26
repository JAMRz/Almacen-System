import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/pagination.dto';
import { Producto } from '../productos/entities/producto.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  async create(CreateClienteDto: CreateClienteDto) {
    const cliente = this.clienteRepo.create(CreateClienteDto);
    return this.clienteRepo.save(cliente);
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const [data, total] = await this.clienteRepo.findAndCount({
      take: limit,
      skip: offset,
    });
    return { data, total, limit, offset };
  }

  async findOne(id: number) {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    const cliente = await this.findOne(id);
    return this.clienteRepo.save({
      ...cliente,
      ...updateClienteDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const productosActivos = await this.productoRepo
      .createQueryBuilder('producto')
      .where('producto.cliente_id = :id', { id })
      .andWhere('producto.eliminado_en IS NULL')
      .getCount();

    if (productosActivos > 0) {
      throw new BadRequestException(
        'No se puede eliminar el cliente porque tiene productos activos relacionados.',
      );
    }

    await this.clienteRepo.softDelete(id);
  }
}
