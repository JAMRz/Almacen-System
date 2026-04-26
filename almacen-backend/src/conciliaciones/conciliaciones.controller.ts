import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Request,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuarios/entities/usuario.entity';
import { ConciliacionesService } from './conciliaciones.service';
import { UpdateConciliacioneDto } from './dto/update-conciliacione.dto';
import { CreateConciliacionDto } from './dto/create-conciliacione.dto';
import { FiltrosConciliacionDto } from 'src/common/filtros.dto';

@Controller('conciliaciones')
export class ConciliacionesController {
  constructor(private readonly conciliacionesService: ConciliacionesService) {}

  @Post()
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  create(
    @Body() createConciliacionDto: CreateConciliacionDto,
    @Request() req: any,
  ) {
    return this.conciliacionesService.create(
      createConciliacionDto,
      req.user.id,
    );
  }

  @Get()
  findAll(@Query() filtros: FiltrosConciliacionDto) {
    return this.conciliacionesService.findAll(filtros);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conciliacionesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.SUPERVISOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConciliacionDto: UpdateConciliacioneDto,
  ) {
    return this.conciliacionesService.update(id, updateConciliacionDto);
  }

  @Delete(':id')
  @Roles(RolUsuario.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.conciliacionesService.remove(id);
  }
}
