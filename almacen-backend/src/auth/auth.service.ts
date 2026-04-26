import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(user: string, password: string) {
    try {
      const usuario = await this.usuariosService.findByUser(user);
      const passwordValido = await bcrypt.compare(password, usuario.password);
      if (!passwordValido) return null;
      return usuario;
    } catch {
      return null;
    }
  }

  async login(usuario: any) {
    const payload = {
      sub: usuario.id,
      user: usuario.user,
      rol: usuario.rol,
    };
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        user: usuario.user,
        rol: usuario.rol,
      },
    };
  }
}
