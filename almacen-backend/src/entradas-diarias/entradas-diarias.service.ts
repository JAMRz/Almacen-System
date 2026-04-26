import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenesProduccionService } from '../ordenes-produccion/ordenes-produccion.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EntradaDiaria } from './entities/entradas-diaria.entity';
import { CreateEntradaDiariaDto } from './dto/create-entradas-diaria.dto';
import { UpdateEntradasDiariaDto } from './dto/update-entradas-diaria.dto';
import { FiltrosEntradaDto } from 'src/common/filtros.dto';
import { InventarioService } from '../inventario/inventario.service';

@Injectable()
export class EntradasDiariasService {
  constructor(
    @InjectRepository(EntradaDiaria)
    private readonly entradaRepo: Repository<EntradaDiaria>,
    private readonly ordenesService: OrdenesProduccionService,
    private readonly usuariosService: UsuariosService,
    private readonly inventarioService: InventarioService,
  ) {}

  async create(
    createEntradaDiariaDto: CreateEntradaDiariaDto,
    usuarioId: string,
  ): Promise<EntradaDiaria> {
    const ordenDetalle = await this.ordenesService.findOneDetalle(
      createEntradaDiariaDto.ordenDetalleId,
    );
    const usuario = await this.usuariosService.findOne(usuarioId);
    const entrada = this.entradaRepo.create({
      ...createEntradaDiariaDto,
      ordenDetalle,
      usuario,
    });

    const entradaGuardada = await this.entradaRepo.save(entrada);
    await this.recalcularInventarioProductos(ordenDetalle.producto?.id);

    return this.findOne(entradaGuardada.id);
  }

  async findAll(filtros: FiltrosEntradaDto) {
    const { limit = 10, offset = 0, ordenId, fecha, turno } = filtros;
    const query = this.entradaRepo
      .createQueryBuilder('entrada')
      .leftJoinAndSelect('entrada.ordenDetalle', 'ordenDetalle')
      .leftJoinAndSelect('ordenDetalle.orden', 'orden')
      .leftJoinAndSelect('ordenDetalle.producto', 'producto')
      .leftJoinAndSelect('producto.cliente', 'cliente')
      .leftJoinAndSelect('entrada.usuario', 'usuario')
      .take(limit)
      .skip(offset)
      .orderBy('entrada.creadoEn', 'DESC');

    if (ordenId) query.andWhere('orden.id = :ordenId', { ordenId });
    if (fecha) query.andWhere('entrada.fecha = :fecha', { fecha });
    if (turno) query.andWhere('entrada.turno = :turno', { turno });

    const [data, total] = await query.getManyAndCount();
    return { data, total, limit, offset };
  }

  async findOne(id: number): Promise<EntradaDiaria> {
    const entrada = await this.entradaRepo.findOne({
      where: { id },
      relations: [
        'ordenDetalle',
        'ordenDetalle.orden',
        'ordenDetalle.producto',
        'ordenDetalle.producto.cliente',
        'usuario',
      ],
    });

    if (!entrada) throw new NotFoundException(`Entrada ${id} no encontrada`);
    return entrada;
  }

  async update(
    id: number,
    updateEntradaDiariaDto: UpdateEntradasDiariaDto,
  ): Promise<EntradaDiaria> {
    const entrada = await this.findOne(id);
    const productoAnteriorId = entrada.ordenDetalle?.producto?.id;

    if (updateEntradaDiariaDto.ordenDetalleId) {
      entrada.ordenDetalle = await this.ordenesService.findOneDetalle(
        updateEntradaDiariaDto.ordenDetalleId,
      );
    }

    const entradaActualizada = await this.entradaRepo.save({
      ...entrada,
      ...updateEntradaDiariaDto,
    });

    await this.recalcularInventarioProductos(
      productoAnteriorId,
      entradaActualizada.ordenDetalle?.producto?.id,
    );

    return this.findOne(entradaActualizada.id);
  }

  async remove(id: number): Promise<void> {
    const entrada = await this.findOne(id);
    await this.entradaRepo.softDelete(id);
    await this.recalcularInventarioProductos(entrada.ordenDetalle?.producto?.id);
  }

  private async recalcularInventarioProductos(
    ...productoIds: Array<number | undefined>
  ): Promise<void> {
    const idsUnicos = [...new Set(productoIds.filter((id): id is number => !!id))];
    await Promise.all(
      idsUnicos.map((productoId) =>
        this.inventarioService.recalculatePersistedInventory(productoId),
      ),
    );
  }
}
