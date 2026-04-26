import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tarima } from '../tarimas/entities/tarima.entity';
import { ProductosService } from '../productos/productos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import {
  Conciliacion,
  EstadoConciliacion,
} from './entities/conciliacione.entity';
import { EntradaDiaria } from 'src/entradas-diarias/entities/entradas-diaria.entity';
import { CreateConciliacionDto } from './dto/create-conciliacione.dto';
import { UpdateConciliacioneDto } from './dto/update-conciliacione.dto';
import { FiltrosConciliacionDto } from 'src/common/filtros.dto';

@Injectable()
export class ConciliacionesService {
  constructor(
    @InjectRepository(Conciliacion)
    private readonly conciliacionRepo: Repository<Conciliacion>,
    @InjectRepository(EntradaDiaria)
    private readonly entradaRepo: Repository<EntradaDiaria>,
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
    private readonly productosService: ProductosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  private calcularEstado(
    diferenciaLibretas: number,
    diferenciaFisico: number,
  ): EstadoConciliacion {
    if (diferenciaLibretas === 0 && diferenciaFisico === 0) {
      return EstadoConciliacion.CONCILIADO;
    }
    return EstadoConciliacion.DISCREPANCIA;
  }

  async create(
    createConciliacionDto: CreateConciliacionDto,
    usuarioId: string,
  ): Promise<Conciliacion> {
    const producto = await this.productosService.findOne(
      createConciliacionDto.productoId,
    );
    const usuario = await this.usuariosService.findOne(usuarioId);

    // suma todas las entradas del producto sin filtro de fecha
    const entradas = await this.entradaRepo
      .createQueryBuilder('entrada')
      .innerJoin(
        'entrada.ordenDetalle',
        'ordenDetalle',
        'ordenDetalle.eliminado_en IS NULL',
      )
      .where('ordenDetalle.producto_id = :productoId', {
        productoId: createConciliacionDto.productoId,
      })
      .andWhere('entrada.eliminado_en IS NULL')
      .select('SUM(entrada.pesoKg)', 'totalKg')
      .getRawOne();

    const pesoEntradas = Number(entradas?.totalKg || 0);

    // suma todas las tarimas del producto sin filtro de fecha
    const tarimas = await this.tarimaRepo
      .createQueryBuilder('tarima')
      .innerJoin(
        'tarima.ordenDetalle',
        'ordenDetalle',
        'ordenDetalle.eliminado_en IS NULL',
      )
      .where('ordenDetalle.producto_id = :productoId', {
        productoId: createConciliacionDto.productoId,
      })
      .andWhere('tarima.eliminado_en IS NULL')
      .select('SUM(tarima.totalKg)', 'totalKg')
      .getRawOne();

    const pesoTarimas = Number(tarimas?.totalKg || 0);

    const pesoFisico = createConciliacionDto.pesoFisico;
    const diferenciaLibretas = pesoEntradas - pesoTarimas;
    const diferenciaFisico = pesoTarimas - pesoFisico;
    const estado = this.calcularEstado(diferenciaLibretas, diferenciaFisico);

    const conciliacion = this.conciliacionRepo.create({
      fecha: new Date().toISOString().split('T')[0],
      pesoEntradas,
      pesoTarimas,
      pesoFisico,
      diferenciaLibretas,
      diferenciaFisico,
      estado,
      notas: createConciliacionDto.notas,
      producto,
      usuario,
    });

    const conciliacionGuardada = await this.conciliacionRepo.save(conciliacion);
    return this.findOne(conciliacionGuardada.id);
  }

  async findAll(filtros: FiltrosConciliacionDto) {
    const { limit = 10, offset = 0, productoId, estado } = filtros;
    const query = this.conciliacionRepo
      .createQueryBuilder('conciliacion')
      .leftJoinAndSelect(
        'conciliacion.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('conciliacion.usuario', 'usuario')
      .where('conciliacion.eliminado_en IS NULL')
      .take(limit)
      .skip(offset)
      .orderBy('conciliacion.creadoEn', 'DESC');

    if (productoId) query.andWhere('producto.id = :productoId', { productoId });
    if (estado) query.andWhere('conciliacion.estado = :estado', { estado });

    const [data, total] = await query.getManyAndCount();
    return { data, total, limit, offset };
  }

  async findOne(id: number): Promise<Conciliacion> {
    const conciliacion = await this.conciliacionRepo
      .createQueryBuilder('conciliacion')
      .leftJoinAndSelect(
        'conciliacion.producto',
        'producto',
        'producto.eliminado_en IS NULL',
      )
      .leftJoinAndSelect(
        'producto.cliente',
        'cliente',
        'cliente.eliminado_en IS NULL',
      )
      .leftJoinAndSelect('conciliacion.usuario', 'usuario')
      .where('conciliacion.id = :id', { id })
      .andWhere('conciliacion.eliminado_en IS NULL')
      .getOne();

    if (!conciliacion)
      throw new NotFoundException(`Conciliacion ${id} no encontrada`);
    return conciliacion;
  }

  async update(
    id: number,
    updateConciliacionDto: UpdateConciliacioneDto,
  ): Promise<Conciliacion> {
    const conciliacion = await this.findOne(id);

    const pesoFisico =
      updateConciliacionDto.pesoFisico ?? conciliacion.pesoFisico;
    const diferenciaLibretas =
      conciliacion.pesoEntradas - conciliacion.pesoTarimas;
    const diferenciaFisico = conciliacion.pesoTarimas - pesoFisico;
    const estado = this.calcularEstado(diferenciaLibretas, diferenciaFisico);

    const conciliacionActualizada = await this.conciliacionRepo.save({
      ...conciliacion,
      pesoFisico,
      diferenciaLibretas,
      diferenciaFisico,
      estado,
      notas: updateConciliacionDto.notas ?? conciliacion.notas,
    });

    return this.findOne(conciliacionActualizada.id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.conciliacionRepo.softDelete(id);
  }
}
