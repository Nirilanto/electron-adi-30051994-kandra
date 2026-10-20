import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pick, toFloat, toInt, toStr } from '../common/utils/coerce';
import { cleanDocument, resolveClientId, resolveContractId, resolveEmployeeId, uuidDoc } from '../common/utils/documents';
import { applyFilters, ListQuery } from '../common/utils/query';

/** Filtres traités en base ; les autres clés sont filtrées en mémoire sur le document. */
const DB_FILTERS = new Set(['employeeId', 'contractId', 'clientId', 'startDate', 'endDate', 'status', 'workType']);

const DUPLICATE_MESSAGE = 'Un pointage existe déjà pour cette date et ce contrat';

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Normalisation identique à TimeTrackingService : employeeId / clientId forcés en chaîne. */
  private normalize(doc: Record<string, any>) {
    if (doc.employeeId !== undefined && doc.employeeId !== null) doc.employeeId = String(doc.employeeId);
    if (doc.clientId !== undefined && doc.clientId !== null) doc.clientId = String(doc.clientId);
    if (!doc.status) doc.status = 'draft';
    return doc;
  }

  private async derive(doc: Record<string, any>) {
    const date = toStr(doc.date);
    if (!date) throw new BadRequestException('La date est obligatoire');
    return {
      employeeId: await resolveEmployeeId(this.prisma, doc.employeeId),
      contractId: await resolveContractId(this.prisma, doc.contractId),
      clientId: await resolveClientId(this.prisma, doc.clientId),
      date: date.length > 10 ? date.slice(0, 10) : date,
      totalHours: toFloat(doc.totalHours),
      normalHours: toFloat(doc.normalHours),
      overtimeHours: toFloat(doc.overtimeHours),
      hourlyRate: toFloat(doc.hourlyRate),
      billingRate: toFloat(doc.billingRate),
      status: toStr(doc.status) || 'draft',
      workType: toStr(doc.workType),
      invoiceId: toInt(doc.invoiceId),
    };
  }

  toDoc = uuidDoc;

  async findAll(query: ListQuery) {
    const f = query.filters;
    const where: Prisma.TimeEntryWhereInput = {};
    if (f.employeeId) where.employeeId = toInt(f.employeeId) ?? -1;
    if (f.contractId) where.contractId = String(f.contractId);
    if (f.clientId) where.clientId = toInt(f.clientId) ?? -1;
    if (f.status) where.status = f.status;
    if (f.workType) where.workType = f.workType;
    if (f.startDate || f.endDate) {
      where.date = {};
      if (f.startDate) where.date.gte = f.startDate.slice(0, 10);
      if (f.endDate) where.date.lte = f.endDate.slice(0, 10);
    }
    const rows = await this.prisma.timeEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(f)) if (!DB_FILTERS.has(k)) extra[k] = v;
    return applyFilters(rows.map(uuidDoc), extra);
  }

  async findOne(id: string) {
    const row = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Pointage non trouvé avec l'ID: ${id}`);
    return uuidDoc(row);
  }

  /** Recherche par employé / contrat / date (unicité du pointage). */
  async lookup(employeeId: string, contractId: string, date: string) {
    const rows = await this.prisma.timeEntry.findMany({
      where: { contractId: String(contractId), date: String(date).slice(0, 10) },
    });
    const docs = rows.map(uuidDoc);
    return docs.find((d) => String(d.employeeId) === String(employeeId)) || null;
  }

  async create(input: unknown) {
    const doc = this.normalize(cleanDocument(input));
    const derived = await this.derive(doc);
    const duplicate = await this.lookup(doc.employeeId, doc.contractId, derived.date);
    if (duplicate) throw new ConflictException(DUPLICATE_MESSAGE);
    try {
      const row = await this.prisma.timeEntry.create({
        data: { ...derived, data: doc as Prisma.InputJsonValue },
      });
      return uuidDoc(row);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(DUPLICATE_MESSAGE);
      }
      throw e;
    }
  }

  async update(id: string, input: unknown) {
    const existing = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Pointage non trouvé avec l'ID: ${id}`);
    if (existing.status === 'invoiced') {
      throw new ConflictException('Impossible de modifier un pointage facturé');
    }
    const doc = this.normalize({ ...(existing.data as Record<string, any>), ...cleanDocument(input) });
    const row = await this.prisma.timeEntry.update({
      where: { id },
      data: { ...(await this.derive(doc)), data: doc as Prisma.InputJsonValue },
    });
    return uuidDoc(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Pointage non trouvé avec l'ID: ${id}`);
    if (existing.status === 'invoiced') {
      throw new ConflictException('Impossible de supprimer un pointage facturé');
    }
    await this.prisma.timeEntry.delete({ where: { id } });
    return { success: true };
  }

  /** Import de sauvegarde partielle : fusion sans doublon d'identifiant. */
  async importEntries(entries: unknown) {
    if (!Array.isArray(entries)) throw new BadRequestException("Données d'import invalides");
    const existingIds = new Set((await this.prisma.timeEntry.findMany({ select: { id: true } })).map((r) => r.id));
    let imported = 0;
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const id = entry.id ? String(entry.id) : undefined;
      if (id && existingIds.has(id)) continue;
      const doc = this.normalize(cleanDocument(entry));
      if (!doc.date) continue;
      try {
        await this.prisma.timeEntry.create({ data: { id, ...(await this.derive(doc)), data: doc as Prisma.InputJsonValue } });
        imported++;
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      }
    }
    const total = await this.prisma.timeEntry.count();
    return { success: true, imported, existing: existingIds.size, total };
  }

  /** Supprime les pointages incomplets (sans employé, contrat ou date). */
  async cleanup() {
    const rows = await this.prisma.timeEntry.findMany();
    const invalid = rows.filter((r) => {
      const d = r.data as Record<string, any>;
      return !(d.employeeId && d.contractId && d.date);
    });
    if (invalid.length > 0) {
      await this.prisma.timeEntry.deleteMany({ where: { id: { in: invalid.map((r) => r.id) } } });
    }
    return { success: true, cleanedCount: invalid.length, remainingCount: rows.length - invalid.length };
  }

  async insertWithId(tx: Prisma.TransactionClient, raw: Record<string, any>) {
    const doc = this.normalize(cleanDocument(raw));
    const date = toStr(doc.date);
    if (!date) return;
    const derived = {
      employeeId: toInt(doc.employeeId),
      contractId: doc.contractId ? String(doc.contractId) : null,
      clientId: toInt(doc.clientId),
      date: date.slice(0, 10),
      totalHours: toFloat(doc.totalHours),
      normalHours: toFloat(doc.normalHours),
      overtimeHours: toFloat(doc.overtimeHours),
      hourlyRate: toFloat(doc.hourlyRate),
      billingRate: toFloat(doc.billingRate),
      status: toStr(doc.status) || 'draft',
      workType: toStr(doc.workType),
      invoiceId: toInt(doc.invoiceId),
    };
    if (derived.employeeId !== null && !(await tx.employee.findUnique({ where: { id: derived.employeeId }, select: { id: true } }))) derived.employeeId = null;
    if (derived.clientId !== null && !(await tx.client.findUnique({ where: { id: derived.clientId }, select: { id: true } }))) derived.clientId = null;
    if (derived.contractId !== null && !(await tx.contract.findUnique({ where: { id: derived.contractId }, select: { id: true } }))) derived.contractId = null;
    await tx.timeEntry.create({
      data: {
        id: raw.id ? String(raw.id) : undefined,
        ...derived,
        data: doc as Prisma.InputJsonValue,
        createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      },
    });
  }

  /** Utilisé par le tableau de bord. */
  findRaw(where: Prisma.TimeEntryWhereInput) {
    return this.prisma.timeEntry.findMany({ where });
  }

  static pickEmployeeKey(doc: Record<string, any>) {
    return pick(doc, 'employeeId');
  }
}
