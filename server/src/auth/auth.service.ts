import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** L'application a-t-elle besoin de créer son premier administrateur ? */
  async status() {
    const count = await this.users.count();
    return { needsSetup: count === 0 };
  }

  /** Création du premier compte administrateur (uniquement si aucun utilisateur n'existe). */
  async setup(email: string, password: string, name: string) {
    const count = await this.users.count();
    if (count > 0) {
      throw new BadRequestException("L'application est déjà initialisée");
    }
    const user = await this.users.create({ email, password, name, role: 'admin' });
    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.issueToken(user);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Mot de passe actuel incorrect');
    await this.users.update(userId, { password: newPassword });
    return { success: true };
  }

  private issueToken(user: { id: number; email: string; name: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, role: user.role as AuthUser['role'] };
    return { token: this.jwt.sign(payload), user: authUser };
  }
}
