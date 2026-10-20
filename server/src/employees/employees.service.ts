import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pick, toDateStr, toFloat, toStr } from '../common/utils/coerce';
import { cleanDocument, numericDoc } from '../common/utils/documents';
import { applyFilters, ListQuery, sortItems } from '../common/utils/query';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Colonnes typées dérivées du document. */
  private derive(doc: Record<string, any>) {
    return {
      firstName: toStr(pick(doc, 'firstName', 'firstname')),
      lastName: toStr(pick(doc, 'lastName', 'lastname')),
      email: toStr(doc.email),
      phone: toStr(doc.phone),
      mobile: toStr(doc.mobile),
      city: toStr(doc.city),
      postalCode: toStr(pick(doc, 'postalCode', 'postal_code')),
      status: toStr(doc.status) || 'active',
      employeeNumber: toStr(pick(doc, 'employeeNumber', 'employee_number')),
      qualification: toStr(doc.qualification),
      nationality: toStr(doc.nationality),
      hourlyRate: toFloat(pick(doc, 'hourlyRate', 'hourly_rate')),
      socialSecurityNumber: toStr(pick(doc, 'socialSecurityNumber', 'social_security_number')),
      hireDate: toDateStr(pick(doc, 'hireDate', 'hire_date')),
      departureDate: toDateStr(pick(doc, 'departureDate', 'departure_date')),
    };
  }

  toDoc = numericDoc;

  async findAll(query: ListQuery) {
    const rows = await this.prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
    });
    const docs = applyFilters(rows.map(numericDoc), query.filters);
    return query.order ? sortItems(docs, query.order, query.direction) : docs;
  }

  async findOne(id: number) {
    const row = await this.prisma.employee.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans employees`);
    return numericDoc(row);
  }

  async create(input: unknown) {
    const data = cleanDocument(input);
    const row = await this.prisma.employee.create({
      data: { ...this.derive(data), data: data as Prisma.InputJsonValue },
    });
    return numericDoc(row);
  }

  /** Mise à jour par fusion (même sémantique que l'ancien DatabaseService.update). */
  async update(id: number, input: unknown) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans employees`);
    const data = { ...(existing.data as Record<string, any>), ...cleanDocument(input) };
    const row = await this.prisma.employee.update({
      where: { id },
      data: { ...this.derive(data), data: data as Prisma.InputJsonValue },
    });
    return numericDoc(row);
  }

  async remove(id: number) {
    const existing = await this.prisma.employee.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans employees`);
    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }

  /** Insertion avec identifiant explicite (restauration de sauvegarde). */
  async insertWithId(tx: Prisma.TransactionClient, doc: Record<string, any>) {
    const data = cleanDocument(doc);
    await tx.employee.create({
      data: {
        id: Number(doc.id),
        ...this.derive(data),
        data: data as Prisma.InputJsonValue,
        createdAt: doc.created_at ? new Date(doc.created_at) : undefined,
      },
    });
  }
}
