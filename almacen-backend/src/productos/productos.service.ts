import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { ClientesService } from '../clientes/clientes.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltrosProductoDto } from 'src/common/filtros.dto';
import { OrdenDetalle } from '../ordenes-produccion/entities/orden-detalle.entity';
import { Movimiento } from '../movimientos/entities/movimiento.entity';
import { Conciliacion } from '../conciliaciones/entities/conciliacione.entity';

@Injectable()
export class ProductosService implements OnModuleInit {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(OrdenDetalle)
    private readonly ordenDetalleRepo: Repository<OrdenDetalle>,
    @InjectRepository(Movimiento)
    private readonly movimientoRepo: Repository<Movimiento>,
    @InjectRepository(Conciliacion)
    private readonly conciliacionRepo: Repository<Conciliacion>,
    private readonly clientesService: ClientesService,
  ) {}

  async onModuleInit() {
    await this.sincronizarClavesExistentes();
  }

  private normalizarSegmento(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 32);
  }

  private normalizarMedidas(medidas?: string | null): string {
    const value = medidas?.trim();
    return value && value.length > 0 ? value : 'POR-DEFINIR';
  }

  private construirClaveBase(params: {
    clienteNombre: string;
    nombre: string;
    presentacion: string;
    medidas: string;
  }): string {
    const segmentos = [
      this.normalizarSegmento(params.clienteNombre),
      this.normalizarSegmento(params.nombre),
      this.normalizarSegmento(params.presentacion),
      this.normalizarSegmento(params.medidas),
    ].filter(Boolean);

    return segmentos.join('-');
  }

  private async generarClaveUnica(
    params: {
      clienteNombre: string;
      nombre: string;
      presentacion: string;
      medidas: string;
    },
    currentId?: number,
  ): Promise<string> {
    const base = this.construirClaveBase(params);
    let candidate = base;
    let suffix = 2;

    while (await this.existeClaveActiva(candidate, currentId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async existeClaveActiva(
    clave: string,
    currentId?: number,
  ): Promise<boolean> {
    const query = this.productoRepo
      .createQueryBuilder('producto')
      .where('producto.clave = :clave', { clave })
      .andWhere('producto.eliminado_en IS NULL');

    if (currentId) {
      query.andWhere('producto.id != :currentId', { currentId });
    }

    return query.getExists();
  }

  private async sincronizarClavesExistentes(): Promise<void> {
    const productos = await this.productoRepo
      .createQueryBuilder('producto')
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .where('producto.eliminado_en IS NULL')
      .orderBy('producto.id', 'ASC')
      .getMany();

    for (const producto of productos) {
      if (!producto.cliente) {
        continue;
      }

      const medidas = this.normalizarMedidas(producto.medidas);
      const clave = await this.generarClaveUnica(
        {
          clienteNombre: producto.cliente.nombre,
          nombre: producto.nombre,
          presentacion: producto.presentacion,
          medidas,
        },
        producto.id,
      );

      if (producto.clave !== clave || producto.medidas !== medidas) {
        await this.productoRepo.update(producto.id, { clave, medidas });
      }
    }
  }

  async create(createProductoDto: CreateProductoDto) {
    const cliente = await this.clientesService.findOne(
      createProductoDto.clienteId,
    );
    const medidas = this.normalizarMedidas(createProductoDto.medidas);
    const clave = await this.generarClaveUnica({
      clienteNombre: cliente.nombre,
      nombre: createProductoDto.nombre,
      presentacion: createProductoDto.presentacion,
      medidas,
    });
    const producto = this.productoRepo.create({
      ...createProductoDto,
      clave,
      medidas,
      cliente,
    });
    return this.productoRepo.save(producto);
  }

  async findAll(filtros: FiltrosProductoDto) {
    const { limit = 10, offset = 0, clienteId, nombre } = filtros;
    const query = this.productoRepo
      .createQueryBuilder('producto')
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .take(limit)
      .skip(offset);

    if (clienteId) query.andWhere('cliente.id = :clienteId', { clienteId });
    if (nombre)
      query.andWhere('producto.nombre ILIKE :nombre', {
        nombre: `%${nombre}%`,
      });

    const [data, total] = await query.getManyAndCount();
    return { data, total, limit, offset };
  }

  async findOne(id: number) {
    const producto = await this.productoRepo
      .createQueryBuilder('producto')
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .where('producto.id = :id', { id })
      .andWhere('producto.eliminado_en IS NULL')
      .getOne();

    if (!producto) throw new NotFoundException(`Producto ${id} no encontrado`);
    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const producto = await this.findOne(id);

    if (updateProductoDto.clienteId) {
      producto.cliente = await this.clientesService.findOne(
        updateProductoDto.clienteId,
      );
    }

    const medidas = this.normalizarMedidas(
      updateProductoDto.medidas ?? producto.medidas,
    );

    producto.clave = await this.generarClaveUnica(
      {
        clienteNombre: producto.cliente.nombre,
        nombre: updateProductoDto.nombre ?? producto.nombre,
        presentacion: updateProductoDto.presentacion ?? producto.presentacion,
        medidas,
      },
      producto.id,
    );

    return this.productoRepo.save({
      ...producto,
      ...updateProductoDto,
      medidas,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const [ordenesActivas, movimientosActivos, conciliacionesActivas] =
      await Promise.all([
        this.ordenDetalleRepo
          .createQueryBuilder('detalle')
          .where('detalle.producto_id = :id', { id })
          .andWhere('detalle.eliminado_en IS NULL')
          .getCount(),
        this.movimientoRepo
          .createQueryBuilder('movimiento')
          .where('movimiento.producto_id = :id', { id })
          .andWhere('movimiento.eliminado_en IS NULL')
          .getCount(),
        this.conciliacionRepo
          .createQueryBuilder('conciliacion')
          .where('conciliacion.producto_id = :id', { id })
          .andWhere('conciliacion.eliminado_en IS NULL')
          .getCount(),
      ]);

    if (ordenesActivas > 0 || movimientosActivos > 0 || conciliacionesActivas > 0) {
      throw new BadRequestException(
        'No se puede eliminar el producto porque tiene órdenes, movimientos o conciliaciones activas relacionadas.',
      );
    }

    await this.productoRepo.softDelete(id);
  }
}
