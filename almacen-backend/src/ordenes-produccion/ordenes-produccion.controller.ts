// src/ordenes-produccion/ordenes-produccion.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { OrdenesProduccionService } from './ordenes-produccion.service';
import { CreateOrdenProduccionDto } from './dto/create-ordenes-produccion.dto';
import { UpdateOrdenesProduccionDto } from './dto/update-ordenes-produccion.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolUsuario } from 'src/usuarios/entities/usuario.entity';
import { FiltrosOrdenDto } from 'src/common/filtros.dto';

@Controller('ordenes-produccion')
export class OrdenesProduccionController {
  constructor(
    private readonly ordenesProduccionService: OrdenesProduccionService,
  ) {}

  @Post()
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  create(@Body() createOrdenProduccionDto: CreateOrdenProduccionDto) {
    return this.ordenesProduccionService.create(createOrdenProduccionDto);
  }

  @Get('detalles')
  findAllDetalles() {
    return this.ordenesProduccionService.findAllDetalles();
  }

  @Get()
  findAll(@Query() filtros: FiltrosOrdenDto) {
    return this.ordenesProduccionService.findAll(filtros);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesProduccionService.findOne(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrdenProduccionDto: UpdateOrdenesProduccionDto,
  ) {
    return this.ordenesProduccionService.update(id, updateOrdenProduccionDto);
  }

  @Delete(':id')
  @Roles(RolUsuario.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesProduccionService.remove(id);
  }
}
