import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    const usuario = await this.usuariosService.findOne(payload.sub);

    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
    if (usuario.eliminadoEn)
      throw new UnauthorizedException('Usuario inactivo');

    return {
      id: usuario.id,
      user: usuario.user,
      rol: usuario.rol,
    };
  }
}
