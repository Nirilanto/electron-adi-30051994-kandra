import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const CONTRACT_COUNTER = 'last_contract_number';
export const INVOICE_COUNTER = 'last_invoice_number';

/**
 * Compteurs atomiques : en multi-utilisateurs, deux personnes qui créent un
 * contrat en même temps doivent obtenir deux numéros différents.
 */
@Injectable()
export class CountersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Incrémente et renvoie la nouvelle valeur (création du compteur si besoin). */
  async next(name: string, initial = 0, client: Prisma.TransactionClient | PrismaService = this.prisma): Promise<number> {
    await client.$executeRaw`INSERT INTO counters (name, value) VALUES (${name}, ${initial}) ON CONFLICT (name) DO NOTHING`;
    const rows = await client.$queryRaw<{ value: number }[]>`UPDATE counters SET value = value + 1 WHERE name = ${name} RETURNING value`;
    return Number(rows[0].value);
  }

  async get(name: string): Promise<number | null> {
    const row = await this.prisma.counter.findUnique({ where: { name } });
    return row ? row.value : null;
  }

  async set(name: string, value: number, client: Prisma.TransactionClient | PrismaService = this.prisma) {
    await client.counter.upsert({ where: { name }, update: { value }, create: { name, value } });
  }

  /** Numéro de contrat : séquence à partir de 100001 (comme l'application d'origine). */
  nextContractNumber(client?: Prisma.TransactionClient) {
    return this.next(CONTRACT_COUNTER, 100000, client);
  }

  /** Numéro de facture : FAC-AAAA-NNNN avec un compteur global. */
  async nextInvoiceNumber(client?: Prisma.TransactionClient) {
    const n = await this.next(INVOICE_COUNTER, 0, client);
    return `FAC-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
  }

  list() {
    return this.prisma.counter.findMany({ orderBy: { name: 'asc' } });
  }
}
