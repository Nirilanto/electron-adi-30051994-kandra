import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pick, toStr } from '../common/utils/coerce';
import { cleanDocument, numericDoc } from '../common/utils/documents';
import { applyFilters, ListQuery, sortItems } from '../common/utils/query';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private derive(doc: Record<string, any>) {
    return {
      companyName: toStr(pick(doc, 'companyName', 'company_name')),
      contactName: toStr(pick(doc, 'contactName', 'contact_name')),
      email: toStr(doc.email),
      phone: toStr(doc.phone),
      siret: toStr(doc.siret),
      city: toStr(doc.city),
      postalCode: toStr(pick(doc, 'postalCode', 'postal_code')),
      status: toStr(doc.status) || 'active',
      clientNumber: toStr(pick(doc, 'clientNumber', 'client_number')),
    };
  }

  toDoc = numericDoc;

  async findAll(query: ListQuery) {
    const rows = await this.prisma.client.findMany({
      orderBy: [{ companyName: 'asc' }, { id: 'asc' }],
    });
    const docs = applyFilters(rows.map(numericDoc), query.filters);
    return query.order ? sortItems(docs, query.order, query.direction) : docs;
  }

  async findOne(id: number) {
    const row = await this.prisma.client.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans clients`);
    return numericDoc(row);
  }

  async create(input: unknown) {
    const data = cleanDocument(input);
    const row = await this.prisma.client.create({
      data: { ...this.derive(data), data: data as Prisma.InputJsonValue },
    });
    return numericDoc(row);
  }

  async update(id: number, input: unknown) {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans clients`);
    const data = { ...(existing.data as Record<string, any>), ...cleanDocument(input) };
    const row = await this.prisma.client.update({
      where: { id },
      data: { ...this.derive(data), data: data as Prisma.InputJsonValue },
    });
    return numericDoc(row);
  }

  async remove(id: number) {
    const existing = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans clients`);
    await this.prisma.client.delete({ where: { id } });
    return { success: true };
  }

  async insertWithId(tx: Prisma.TransactionClient, doc: Record<string, any>) {
    const data = cleanDocument(doc);
    await tx.client.create({
      data: {
        id: Number(doc.id),
        ...this.derive(data),
        data: data as Prisma.InputJsonValue,
        createdAt: doc.created_at ? new Date(doc.created_at) : undefined,
      },
    });
  }
}
