import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductosService } from '../productos/productos.service';
import { OrdenProduccion } from './entities/ordenes-produccion.entity';
import { OrdenDetalle } from './entities/orden-detalle.entity';
import { CreateOrdenProduccionDto } from './dto/create-ordenes-produccion.dto';
import { UpdateOrdenesProduccionDto } from './dto/update-ordenes-produccion.dto';
import { FiltrosOrdenDto } from 'src/common/filtros.dto';
import { Tarima } from '../tarimas/entities/tarima.entity';
import { EntradaDiaria } from '../entradas-diarias/entities/entradas-diaria.entity';

@Injectable()
export class OrdenesProduccionService {
  constructor(
    @InjectRepository(OrdenProduccion)
    private readonly ordenRepo: Repository<OrdenProduccion>,
    @InjectRepository(OrdenDetalle)
    private readonly ordenDetalleRepo: Repository<OrdenDetalle>,
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
    @InjectRepository(EntradaDiaria)
    private readonly entradaRepo: Repository<EntradaDiaria>,
    private readonly productosService: ProductosService,
  ) {}

  async create(createOrdenProduccionDto: CreateOrdenProduccionDto) {
    const orden = this.ordenRepo.create({
      folio: createOrdenProduccionDto.folio,
    });
    
    const savedOrden = await this.ordenRepo.save(orden);

    const detalles = await Promise.all(
      createOrdenProduccionDto.productoIds.map(async (productoId) => {
        const producto = await this.productosService.findOne(productoId);
        const detalle = this.ordenDetalleRepo.create({
          orden: savedOrden,
          producto,
        });
        return this.ordenDetalleRepo.save(detalle);
      }),
    );

    return this.findOne(savedOrden.id);
  }

  async findAll(filtros: FiltrosOrdenDto) {
    const { limit = 10, offset = 0, productoId, folio } = filtros;
    const query = this.ordenRepo
      .createQueryBuilder('orden')
      .leftJoinAndSelect(
        'orden.detalles',
        'detalles',
        'detalles.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'detalles.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .where('orden.eliminado_en IS NULL')
      .take(limit)
      .skip(offset)
      .orderBy('orden.creadoEn', 'DESC');

    if (productoId) query.andWhere('producto.id = :productoId', { productoId });
    if (folio)
      query.andWhere('orden.folio ILIKE :folio', { folio: `%${folio}%` });

    const [data, total] = await query.getManyAndCount();
    return { data, total, limit, offset };
  }

  async findAllDetalles() {
    return this.ordenDetalleRepo
      .createQueryBuilder('detalle')
      .innerJoinAndSelect('detalle.orden', 'orden', 'orden.eliminado_en IS NULL')
      .innerJoinAndSelect(
        'detalle.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .where('detalle.eliminado_en IS NULL')
      .orderBy('detalle.creadoEn', 'DESC')
      .getMany();
  }

  async findOne(id: number) {
    const orden = await this.ordenRepo
      .createQueryBuilder('orden')
      .leftJoinAndSelect(
        'orden.detalles',
        'detalles',
        'detalles.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'detalles.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .where('orden.id = :id', { id })
      .andWhere('orden.eliminado_en IS NULL')
      .getOne();

    if (!orden) throw new NotFoundException(`Orden ${id} no encontrada`);
    return orden;
  }
  
  async findOneDetalle(id: number) {
    const detalle = await this.ordenDetalleRepo
      .createQueryBuilder('detalle')
      .innerJoinAndSelect('detalle.orden', 'orden', 'orden.eliminado_en IS NULL')
      .innerJoinAndSelect(
        'detalle.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .where('detalle.id = :id', { id })
      .andWhere('detalle.eliminado_en IS NULL')
      .getOne();

    if (!detalle)
      throw new NotFoundException(`Detalle de orden ${id} no encontrado`);

    return detalle;
  }

  async update(
    id: number,
    updateOrdenProduccionDto: UpdateOrdenesProduccionDto,
  ) {
    const orden = await this.findOne(id);
    // Para simplificar, asumimos que no se actualizan los productos una vez creada la orden (o se requiere lógica extra para borrar/agregar)
    return this.ordenRepo.save({
      ...orden,
      folio: updateOrdenProduccionDto.folio || orden.folio,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const detalles = await this.ordenDetalleRepo
      .createQueryBuilder('detalle')
      .where('detalle.orden_id = :id', { id })
      .andWhere('detalle.eliminado_en IS NULL')
      .getMany();

    const detalleIds = detalles.map((detalle) => detalle.id);

    if (detalleIds.length > 0) {
      const [tarimasActivas, entradasActivas] = await Promise.all([
        this.tarimaRepo
          .createQueryBuilder('tarima')
          .where('tarima.orden_detalle_id IN (:...detalleIds)', { detalleIds })
          .andWhere('tarima.eliminado_en IS NULL')
          .getCount(),
        this.entradaRepo
          .createQueryBuilder('entrada')
          .where('entrada.orden_detalle_id IN (:...detalleIds)', { detalleIds })
          .andWhere('entrada.eliminado_en IS NULL')
          .getCount(),
      ]);

      if (tarimasActivas > 0 || entradasActivas > 0) {
        throw new BadRequestException(
          'No se puede eliminar la orden porque tiene tarimas o entradas activas relacionadas.',
        );
      }

      await this.ordenDetalleRepo
        .createQueryBuilder()
        .softDelete()
        .where('orden_id = :id', { id })
        .andWhere('eliminado_en IS NULL')
        .execute();
    }

    await this.ordenRepo.softDelete(id);
  }
}

