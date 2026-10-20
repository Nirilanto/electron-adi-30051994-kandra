import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toDateStr, toInt, toStr } from '../common/utils/coerce';
import { cleanDocument, numericDoc, resolveEmployeeId } from '../common/utils/documents';
import { applyFilters, ListQuery, sortItems } from '../common/utils/query';

@Injectable()
export class PayslipsService {
  constructor(private readonly prisma: PrismaService) {}

  private async derive(doc: Record<string, any>) {
    return {
      employeeId: await resolveEmployeeId(this.prisma, doc.employeeId),
      periodStart: toDateStr(doc.periodStart),
      periodEnd: toDateStr(doc.periodEnd),
      paymentDate: toDateStr(doc.paymentDate),
      status: toStr(doc.status) || 'draft',
    };
  }

  toDoc = numericDoc;

  async findAll(query: ListQuery) {
    const rows = await this.prisma.payslip.findMany({ orderBy: [{ id: 'asc' }] });
    const docs = applyFilters(rows.map(numericDoc), query.filters);
    return sortItems(docs, query.order, query.direction, ['id']);
  }

  async findOne(id: number) {
    const row = await this.prisma.payslip.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans payslips`);
    return numericDoc(row);
  }

  async create(input: unknown) {
    const data = cleanDocument(input);
    const row = await this.prisma.payslip.create({
      data: { ...(await this.derive(data)), data: data as Prisma.InputJsonValue },
    });
    return numericDoc(row);
  }

  async update(id: number, input: unknown) {
    const existing = await this.prisma.payslip.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans payslips`);
    const data = { ...(existing.data as Record<string, any>), ...cleanDocument(input) };
    const row = await this.prisma.payslip.update({
      where: { id },
      data: { ...(await this.derive(data)), data: data as Prisma.InputJsonValue },
    });
    return numericDoc(row);
  }

  async remove(id: number) {
    const existing = await this.prisma.payslip.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans payslips`);
    await this.prisma.payslip.delete({ where: { id } });
    return { success: true };
  }

  async insertWithId(tx: Prisma.TransactionClient, raw: Record<string, any>) {
    const data = cleanDocument(raw);
    const employeeId = toInt(data.employeeId);
    const exists = employeeId !== null && (await tx.employee.findUnique({ where: { id: employeeId }, select: { id: true } }));
    await tx.payslip.create({
      data: {
        id: Number(raw.id),
        employeeId: exists ? employeeId : null,
        periodStart: toDateStr(data.periodStart),
        periodEnd: toDateStr(data.periodEnd),
        paymentDate: toDateStr(data.paymentDate),
        status: toStr(data.status) || 'draft',
        data: data as Prisma.InputJsonValue,
        createdAt: raw.created_at ? new Date(raw.created_at) : undefined,
      },
    });
  }
}
