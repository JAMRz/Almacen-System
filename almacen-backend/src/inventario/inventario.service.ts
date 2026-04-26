import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { ProductosService } from '../productos/productos.service';
import { PaginationDto } from 'src/common/pagination.dto';
import { EntradaDiaria } from '../entradas-diarias/entities/entradas-diaria.entity';
import { Movimiento, TipoMovimiento } from '../movimientos/entities/movimiento.entity';
import { Producto } from '../productos/entities/producto.entity';
import { DetalleTarima } from '../tarimas/entities/detalle-tarima.entity';

type InventarioCalculado = {
  id: number;
  totalUnidades: number;
  totalKg: number;
  producto: Producto;
  actualizadoEn: string;
  sinStock: boolean;
};

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepo: Repository<Inventario>,
    @InjectRepository(EntradaDiaria)
    private readonly entradaRepo: Repository<EntradaDiaria>,
    @InjectRepository(Movimiento)
    private readonly movimientoRepo: Repository<Movimiento>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(DetalleTarima)
    private readonly detalleTarimaRepo: Repository<DetalleTarima>,
    private readonly productosService: ProductosService,
  ) {}

  // Se conserva por compatibilidad, pero el inventario se deriva del sistema.
  async create(createInventarioDto: { productoId: number }): Promise<InventarioCalculado> {
    return this.recalculatePersistedInventory(createInventarioDto.productoId);
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [productos, total] = await this.productoRepo.findAndCount({
      relations: ['cliente'],
      take: limit,
      skip: offset,
      order: { creadoEn: 'DESC' },
    });

    const data = await Promise.all(
      productos.map((producto) => this.calcularInventario(producto)),
    );

    return { data, total, limit, offset };
  }

  async findOne(id: number): Promise<InventarioCalculado> {
    const producto = await this.productoRepo.findOne({
      where: { id },
      relations: ['cliente'],
    });

    if (!producto) throw new NotFoundException(`Producto ${id} no encontrado`);
    return this.calcularInventario(producto);
  }

  async findByProducto(productoId: number): Promise<InventarioCalculado> {
    const producto = await this.productosService.findOne(productoId);
    return this.calcularInventario(producto);
  }

  async update(
    id: number,
    updateInventarioDto: { productoId?: number },
  ): Promise<InventarioCalculado> {
    return this.recalculatePersistedInventory(updateInventarioDto.productoId ?? id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
  }

  async recalculatePersistedInventory(
    productoId: number,
  ): Promise<InventarioCalculado> {
    const producto = await this.productosService.findOne(productoId);
    const inventarioCalculado = await this.calcularInventario(producto);

    let inventario = await this.inventarioRepo.findOne({
      where: { producto: { id: productoId } },
      relations: ['producto'],
    });

    if (!inventario) {
      inventario = this.inventarioRepo.create({
        producto,
        totalUnidades: 0,
        totalKg: 0,
      });
    }

    inventario.totalUnidades = inventarioCalculado.totalUnidades;
    inventario.totalKg = inventarioCalculado.totalKg;
    await this.inventarioRepo.save(inventario);

    return inventarioCalculado;
  }

  private async calcularInventario(
    producto: Producto,
  ): Promise<InventarioCalculado> {
    const entradas = await this.entradaRepo
      .createQueryBuilder('entrada')
      .leftJoin('entrada.ordenDetalle', 'ordenDetalle')
      .where('ordenDetalle.producto_id = :productoId', { productoId: producto.id })
      .andWhere('entrada.eliminado_en IS NULL')
      .select('SUM(entrada.pesoKg)', 'totalKg')
      .getRawOne();

    const entradasKg = Number(entradas?.totalKg || 0);

    const movEntradas = await this.movimientoRepo
      .createQueryBuilder('mov')
      .where('mov.producto_id = :productoId', { productoId: producto.id })
      .andWhere('mov.tipo = :tipo', { tipo: TipoMovimiento.ENTRADA })
      .andWhere('mov.eliminado_en IS NULL')
      .select('SUM(mov.kg)', 'totalKg')
      .getRawOne();

    const movEntradasKg = Number(movEntradas?.totalKg || 0);

    const movSalidas = await this.movimientoRepo
      .createQueryBuilder('mov')
      .where('mov.producto_id = :productoId', { productoId: producto.id })
      .andWhere('mov.tipo = :tipo', { tipo: TipoMovimiento.SALIDA })
      .andWhere('mov.eliminado_en IS NULL')
      .select('SUM(mov.kg)', 'totalKg')
      .addSelect('SUM(mov.unidades)', 'totalUnidades')
      .getRawOne();

    const movSalidasKg = Number(movSalidas?.totalKg || 0);
    const movSalidasUnidades = Number(movSalidas?.totalUnidades || 0);

    const detalleUnidades = await this.detalleTarimaRepo
      .createQueryBuilder('dt')
      .leftJoin('dt.tarima', 'tarima')
      .leftJoin('tarima.ordenDetalle', 'ordenDetalle')
      .where('ordenDetalle.producto_id = :productoId', { productoId: producto.id })
      .andWhere('dt.eliminado_en IS NULL')
      .andWhere('tarima.eliminado_en IS NULL')
      .select('COUNT(dt.id)', 'count')
      .getRawOne();

    const countUnidadesFabricadas = Number(detalleUnidades?.count || 0);
    const totalKg = entradasKg + movEntradasKg - movSalidasKg;
    const totalUnidades = countUnidadesFabricadas - movSalidasUnidades;
    const sinStock = totalUnidades <= 0 && totalKg <= 0;

    return {
      id: producto.id,
      totalUnidades,
      totalKg,
      producto,
      actualizadoEn: new Date().toISOString(),
      sinStock,
    };
  }
}
