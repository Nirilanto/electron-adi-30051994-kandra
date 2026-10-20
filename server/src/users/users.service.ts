import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface UserInput {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  count() {
    return this.prisma.user.count();
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  }

  list() {
    return this.prisma.user.findMany({ select: PUBLIC_FIELDS, orderBy: { id: 'asc' } });
  }

  async create(input: UserInput) {
    if (!input.email || !input.password || !input.name) {
      throw new BadRequestException('Email, mot de passe et nom sont obligatoires');
    }
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        passwordHash,
        name: input.name.trim(),
        role: input.role === 'admin' ? 'admin' : 'user',
        isActive: input.isActive !== false,
      },
      select: PUBLIC_FIELDS,
    });
  }

  async update(id: number, input: UserInput) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const data: Record<string, unknown> = {};
    if (input.email && input.email.toLowerCase().trim() !== user.email) {
      const existing = await this.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
      data.email = input.email.toLowerCase().trim();
    }
    if (input.name) data.name = input.name.trim();
    if (input.role) data.role = input.role === 'admin' ? 'admin' : 'user';
    if (typeof input.isActive === 'boolean') data.isActive = input.isActive;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);

    // Toujours garder au moins un administrateur actif
    if ((data.role === 'user' || data.isActive === false) && user.role === 'admin') {
      const otherAdmins = await this.prisma.user.count({
        where: { role: 'admin', isActive: true, NOT: { id } },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException('Impossible : il doit rester au moins un administrateur actif');
      }
    }

    return this.prisma.user.update({ where: { id }, data, select: PUBLIC_FIELDS });
  }

  async remove(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
    }
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === 'admin') {
      const otherAdmins = await this.prisma.user.count({
        where: { role: 'admin', isActive: true, NOT: { id } },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException('Impossible : il doit rester au moins un administrateur actif');
      }
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
