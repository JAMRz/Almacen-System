import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarima } from './entities/tarima.entity';
import { DetalleTarima } from './entities/detalle-tarima.entity';
import { OrdenesProduccionService } from '../ordenes-produccion/ordenes-produccion.service';
import { CreateTarimaDto } from './dto/create-tarima.dto';
import { UpdateTarimaDto } from './dto/update-tarima.dto';
import { CreateDetalleTarimaDto } from './dto/create-detalle-tarima.dto';
import { FiltrosTarimaDto } from 'src/common/filtros.dto';
import { InventarioService } from '../inventario/inventario.service';

@Injectable()
export class TarimasService {
  constructor(
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
    @InjectRepository(DetalleTarima)
    private readonly detalleRepo: Repository<DetalleTarima>,
    private readonly ordenesService: OrdenesProduccionService,
    private readonly inventarioService: InventarioService,
  ) {}

  async create(createTarimaDto: CreateTarimaDto): Promise<Tarima> {
    const ordenDetalle = await this.ordenesService.findOneDetalle(
      createTarimaDto.ordenDetalleId,
    );

    const tarima = this.tarimaRepo.create({
      ...createTarimaDto,
      ordenDetalle,
    });

    return this.tarimaRepo.save(tarima);
  }

  async findAll(filtros: FiltrosTarimaDto) {
    const { limit = 10, offset = 0, productoId, ordenId } = filtros;
    const query = this.tarimaRepo
      .createQueryBuilder('tarima')
      .leftJoinAndSelect(
        'tarima.ordenDetalle',
        'ordenDetalle',
        'ordenDetalle.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('ordenDetalle.orden', 'orden', 'orden.eliminado_en IS NULL')
      .leftJoinAndSelect(
        'ordenDetalle.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('tarima.detalles', 'detalles', 'detalles.eliminado_en IS NULL')
      .where('tarima.eliminado_en IS NULL')
      .take(limit)
      .skip(offset)
      .orderBy('tarima.creadoEn', 'DESC');

    if (productoId) query.andWhere('producto.id = :productoId', { productoId });
    if (ordenId) query.andWhere('orden.id = :ordenId', { ordenId });

    const [data, total] = await query.getManyAndCount();
    return { data, total, limit, offset };
  }

  async findOne(id: number): Promise<Tarima> {
    const tarima = await this.tarimaRepo
      .createQueryBuilder('tarima')
      .leftJoinAndSelect(
        'tarima.ordenDetalle',
        'ordenDetalle',
        'ordenDetalle.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('ordenDetalle.orden', 'orden', 'orden.eliminado_en IS NULL')
      .leftJoinAndSelect(
        'ordenDetalle.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('tarima.detalles', 'detalles', 'detalles.eliminado_en IS NULL')
      .where('tarima.id = :id', { id })
      .andWhere('tarima.eliminado_en IS NULL')
      .orderBy('detalles.id', 'ASC')
      .getOne();

    if (!tarima) throw new NotFoundException(`Tarima ${id} no encontrada`);
    return tarima;
  }

  async update(id: number, updateTarimaDto: UpdateTarimaDto): Promise<Tarima> {
    const tarima = await this.findOne(id);
    const productoAnteriorId = tarima.ordenDetalle?.producto?.id;

    if (updateTarimaDto.ordenDetalleId) {
      tarima.ordenDetalle = await this.ordenesService.findOneDetalle(
        updateTarimaDto.ordenDetalleId,
      );
    }

    const tarimaActualizada = await this.tarimaRepo.save({
      ...tarima,
      ...updateTarimaDto,
    });

    await this.recalcularInventarioProductos(
      productoAnteriorId,
      tarimaActualizada.ordenDetalle?.producto?.id,
    );

    return this.findOne(tarimaActualizada.id);
  }

  async remove(id: number): Promise<void> {
    const tarima = await this.findOne(id);
    await this.tarimaRepo.softDelete(id);
    await this.recalcularInventarioProductos(tarima.ordenDetalle?.producto?.id);
  }

  async agregarPeso(
    createDetalleTarimaDto: CreateDetalleTarimaDto,
  ): Promise<Tarima> {
    const tarima = await this.findOne(createDetalleTarimaDto.tarimaId);

    await this.detalleRepo.save({
      pesoKg: createDetalleTarimaDto.pesoKg,
      tarima: { id: createDetalleTarimaDto.tarimaId },
    });

    await this.actualizarTotalesTarima(createDetalleTarimaDto.tarimaId);
    await this.recalcularInventarioProductos(tarima.ordenDetalle?.producto?.id);

    return this.findOne(createDetalleTarimaDto.tarimaId);
  }

  async eliminarPeso(detalleId: number): Promise<Tarima> {
    const detalle = await this.detalleRepo.findOne({
      where: { id: detalleId },
      relations: ['tarima', 'tarima.ordenDetalle', 'tarima.ordenDetalle.producto'],
    });

    if (!detalle)
      throw new NotFoundException(`Detalle ${detalleId} no encontrado`);

    await this.detalleRepo.softDelete(detalleId);
    await this.actualizarTotalesTarima(detalle.tarima.id);
    await this.recalcularInventarioProductos(
      detalle.tarima.ordenDetalle?.producto?.id,
    );

    return this.findOne(detalle.tarima.id);
  }

  async vaciarDetalleTarima(tarimaId: number): Promise<Tarima> {
    const tarima = await this.findOne(tarimaId);

    await this.detalleRepo
      .createQueryBuilder()
      .softDelete()
      .where('tarima_id = :tarimaId', { tarimaId })
      .andWhere('eliminado_en IS NULL')
      .execute();

    await this.actualizarTotalesTarima(tarimaId);
    await this.recalcularInventarioProductos(tarima.ordenDetalle?.producto?.id);

    return this.findOne(tarimaId);
  }

  private async actualizarTotalesTarima(tarimaId: number): Promise<void> {
    const detalles = await this.detalleRepo
      .createQueryBuilder('detalle')
      .where('detalle.tarima_id = :tarimaId', { tarimaId })
      .andWhere('detalle.eliminado_en IS NULL')
      .getMany();

    const totalKg = detalles.reduce((sum, detalle) => {
      return sum + Number(detalle.pesoKg);
    }, 0);

    await this.tarimaRepo.update(tarimaId, {
      totalKg,
      totalUnidades: detalles.length,
    });
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
