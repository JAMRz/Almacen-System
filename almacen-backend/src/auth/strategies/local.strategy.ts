import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'user' });
  }

  async validate(user: string, password: string) {
    const usuario = await this.authService.validateUser(user, password);
    if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');
    return usuario;
  }
}
