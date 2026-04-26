import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { Tarima } from '../tarimas/entities/tarima.entity';
import { ProductosService } from '../productos/productos.service';
import { TarimasService } from '../tarimas/tarimas.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { FiltrosMovimientoDto } from 'src/common/filtros.dto';
import { InventarioService } from '../inventario/inventario.service';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepo: Repository<Movimiento>,
    private readonly productosService: ProductosService,
    private readonly tarimasService: TarimasService,
    private readonly usuariosService: UsuariosService,
    private readonly inventarioService: InventarioService,
  ) {}

  private validarTarimaDelProducto(
    productoId: number,
    tarima: Tarima | null,
  ): void {
    if (!tarima) {
      return;
    }

    const productoTarimaId = tarima.ordenDetalle?.producto?.id;
    if (productoTarimaId !== productoId) {
      throw new BadRequestException(
        'La tarima seleccionada no pertenece al producto indicado.',
      );
    }
  }

  async create(
    createMovimientoDto: CreateMovimientoDto,
    usuarioId: string,
  ): Promise<Movimiento> {
    const producto = await this.productosService.findOne(
      createMovimientoDto.productoId,
    );
    const usuario = await this.usuariosService.findOne(usuarioId);

    let tarima: Tarima | null = null;
    if (createMovimientoDto.tarimaId) {
      tarima = await this.tarimasService.findOne(createMovimientoDto.tarimaId);
    }

    this.validarTarimaDelProducto(producto.id, tarima);

    const movimiento = this.movimientoRepo.create({
      ...createMovimientoDto,
      producto,
      usuario,
      tarima,
    });

    const movimientoGuardado = await this.movimientoRepo.save(movimiento);
    await this.recalcularInventarioProductos(producto.id);

    return this.findOne(movimientoGuardado.id);
  }

  async findAll(filtros: FiltrosMovimientoDto) {
    const { limit = 10, offset = 0, tipo, productoId, fecha } = filtros;
    const query = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect(
        'movimiento.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('movimiento.tarima', 'tarima', 'tarima.eliminado_en IS NULL')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .where('movimiento.eliminado_en IS NULL')
      .take(limit)
      .skip(offset)
      .orderBy('movimiento.creadoEn', 'DESC');

    if (tipo) query.andWhere('movimiento.tipo = :tipo', { tipo });
    if (productoId) query.andWhere('producto.id = :productoId', { productoId });
    if (fecha) query.andWhere('DATE(movimiento.creadoEn) = :fecha', { fecha });

    const [data, total] = await query.getManyAndCount();
    return { data, total, limit, offset };
  }

  async findOne(id: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect(
        'movimiento.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('movimiento.tarima', 'tarima', 'tarima.eliminado_en IS NULL')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .where('movimiento.id = :id', { id })
      .andWhere('movimiento.eliminado_en IS NULL')
      .getOne();

    if (!movimiento)
      throw new NotFoundException(`Movimiento ${id} no encontrado`);

    return movimiento;
  }

  async update(
    id: number,
    updateMovimientoDto: UpdateMovimientoDto,
  ): Promise<Movimiento> {
    const movimiento = await this.findOne(id);
    const productoAnteriorId = movimiento.producto.id;

    if (updateMovimientoDto.productoId) {
      movimiento.producto = await this.productosService.findOne(
        updateMovimientoDto.productoId,
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateMovimientoDto, 'tarimaId')) {
      movimiento.tarima = updateMovimientoDto.tarimaId
        ? await this.tarimasService.findOne(updateMovimientoDto.tarimaId)
        : null;
    }

    this.validarTarimaDelProducto(movimiento.producto.id, movimiento.tarima);

    const { productoId, tarimaId, ...resto } = updateMovimientoDto;
    const movimientoActualizado = await this.movimientoRepo.save({
      ...movimiento,
      producto: movimiento.producto,
      tarima: movimiento.tarima,
      ...resto,
    });

    await this.recalcularInventarioProductos(
      productoAnteriorId,
      movimientoActualizado.producto.id,
    );

    return this.findOne(movimientoActualizado.id);
  }

  async remove(id: number): Promise<void> {
    const movimiento = await this.findOne(id);
    await this.movimientoRepo.softDelete(id);
    await this.recalcularInventarioProductos(movimiento.producto.id);
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
