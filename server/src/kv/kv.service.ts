import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Stockage clé/valeur générique (équivalent des anciennes clés localStorage libres). */
@Injectable()
export class KvService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<unknown> {
    const row = await this.prisma.kvEntry.findUnique({ where: { key } });
    return row ? row.value : null;
  }

  async set(key: string, value: unknown, tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    const json = (value === undefined ? null : value) as Prisma.InputJsonValue;
    await tx.kvEntry.upsert({ where: { key }, update: { value: json }, create: { key, value: json } });
    return true;
  }

  async remove(key: string) {
    await this.prisma.kvEntry.deleteMany({ where: { key } });
    return true;
  }

  async keys() {
    const rows = await this.prisma.kvEntry.findMany({ select: { key: true }, orderBy: { key: 'asc' } });
    return rows.map((r) => r.key);
  }

  async all() {
    const rows = await this.prisma.kvEntry.findMany({ orderBy: { key: 'asc' } });
    const out: Record<string, unknown> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  }
}
