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
import { EntradasDiariasService } from './entradas-diarias.service';
import { CreateEntradaDiariaDto } from './dto/create-entradas-diaria.dto';
import { UpdateEntradasDiariaDto } from './dto/update-entradas-diaria.dto';
import { FiltrosEntradaDto } from 'src/common/filtros.dto';

@Controller('entradas-diarias')
export class EntradasDiariasController {
  constructor(
    private readonly entradasDiariasService: EntradasDiariasService,
  ) {}

  @Post()
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  create(
    @Body() createEntradaDiariaDto: CreateEntradaDiariaDto,
    @Request() req: any,
  ) {
    return this.entradasDiariasService.create(
      createEntradaDiariaDto,
      req.user.id,
    );
  }

  @Get()
  findAll(@Query() filtros: FiltrosEntradaDto) {
    return this.entradasDiariasService.findAll(filtros);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entradasDiariasService.findOne(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntradaDiariaDto: UpdateEntradasDiariaDto,
  ) {
    return this.entradasDiariasService.update(id, updateEntradaDiariaDto);
  }

  @Delete(':id')
  @Roles(RolUsuario.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entradasDiariasService.remove(id);
  }
}
