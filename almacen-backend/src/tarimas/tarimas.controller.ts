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
import { TarimasService } from './tarimas.service';
import { CreateTarimaDto } from './dto/create-tarima.dto';
import { UpdateTarimaDto } from './dto/update-tarima.dto';
import { CreateDetalleTarimaDto } from './dto/create-detalle-tarima.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolUsuario } from 'src/usuarios/entities/usuario.entity';
import { FiltrosTarimaDto } from 'src/common/filtros.dto';

@Controller('tarimas')
export class TarimasController {
  constructor(private readonly tarimasService: TarimasService) {}

  @Post()
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  create(@Body() createTarimaDto: CreateTarimaDto) {
    return this.tarimasService.create(createTarimaDto);
  }

  @Get()
  findAll(@Query() filtros: FiltrosTarimaDto) {
    return this.tarimasService.findAll(filtros);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarimasService.findOne(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTarimaDto: UpdateTarimaDto,
  ) {
    return this.tarimasService.update(id, updateTarimaDto);
  }

  @Delete(':id')
  @Roles(RolUsuario.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarimasService.remove(id);
  }

  // ── Detalle tarima ──────────────────────────────

  @Post('detalle')
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  agregarPeso(@Body() createDetalleTarimaDto: CreateDetalleTarimaDto) {
    return this.tarimasService.agregarPeso(createDetalleTarimaDto);
  }

  @Delete('detalle/:id')
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  eliminarPeso(@Param('id', ParseIntPipe) id: number) {
    return this.tarimasService.eliminarPeso(id);
  }

  @Delete(':id/detalle')
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  vaciarDetalleTarima(@Param('id', ParseIntPipe) id: number) {
    return this.tarimasService.vaciarDetalleTarima(id);
  }
}
