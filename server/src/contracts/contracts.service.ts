import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CountersService } from '../counters/counters.service';
import { isPlainObject, omit, pick, toDateStr, toFloat, toInt, toStr } from '../common/utils/coerce';
import { cleanDocument, numericDoc, resolveClientId, resolveEmployeeId, uuidDoc } from '../common/utils/documents';
import { applyFilters, ListQuery, sortItems } from '../common/utils/query';

/**
 * Clés calculées à la lecture (enrichissement) : jamais stockées, pour ne plus
 * dupliquer les images de signature dans chaque contrat.
 */
const TRANSIENT_KEYS = [
  'client',
  'employee',
  'signature',
  'stamp',
  'securityMeasuresList',
  'employee_firstname',
  'employee_lastname',
  'client_company',
];

type ContractRow = Prisma.ContractGetPayload<{ include: { employee: true; client: true } }>;

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly counters: CountersService,
  ) {}

  /** Nettoyage identique à l'ancien ContractService.saveContract. */
  private sanitize(input: unknown): Record<string, any> {
    const doc = omit(cleanDocument(input), TRANSIENT_KEYS);
    doc.signatureId = doc.signatureId || '';
    doc.stampId = doc.stampId || '';
    doc.securityMeasures = Array.isArray(doc.securityMeasures) ? doc.securityMeasures : [];
    return doc;
  }

  private async derive(doc: Record<string, any>) {
    return {
      contractNumber: toInt(pick(doc, 'contractNumber', 'contract_number')),
      title: toStr(doc.title),
      employeeId: await resolveEmployeeId(this.prisma, pick(doc, 'employeeId', 'employee_id')),
      clientId: await resolveClientId(this.prisma, pick(doc, 'clientId', 'client_id')),
      startDate: toDateStr(pick(doc, 'startDate', 'start_date')),
      endDate: toDateStr(pick(doc, 'endDate', 'end_date')),
      location: toStr(doc.location),
      hourlyRate: toFloat(pick(doc, 'hourlyRate', 'hourly_rate')),
      billingRate: toFloat(pick(doc, 'billingRate', 'billing_rate')),
      signatureId: toInt(doc.signatureId),
      stampId: toInt(doc.stampId),
    };
  }

  /** Contrat enrichi avec les objets employé / client (comme ContractService.getAllContracts). */
  toDoc(row: ContractRow) {
    const doc: Record<string, any> = uuidDoc(row);
    if (row.employee) {
      doc.employee = numericDoc(row.employee);
      doc.employee_firstname = pick(doc.employee, 'firstName', 'firstname') ?? '';
      doc.employee_lastname = pick(doc.employee, 'lastName', 'lastname') ?? '';
    }
    if (row.client) {
      doc.client = numericDoc(row.client);
      doc.client_company = pick(doc.client, 'companyName', 'company_name') ?? '';
    }
    return doc;
  }

  async findAll(query: ListQuery) {
    const rows = await this.prisma.contract.findMany({
      include: { employee: true, client: true },
      orderBy: [{ createdAt: 'asc' }],
    });
    const docs = applyFilters(rows.map((r) => this.toDoc(r)), query.filters);
    return query.order ? sortItems(docs, query.order, query.direction) : docs;
  }

  async findOne(id: string) {
    const row = await this.prisma.contract.findUnique({ where: { id }, include: { employee: true, client: true } });
    if (!row) throw new NotFoundException(`Aucun contrat trouvé avec l'ID ${id}`);
    return this.toDoc(row);
  }

  async create(input: unknown) {
    const doc = this.sanitize(input);
    const row = await this.prisma.$transaction(async (tx) => {
      if (!toInt(doc.contractNumber)) {
        doc.contractNumber = await this.counters.nextContractNumber(tx);
      }
      const derived = await this.derive(doc);
      return tx.contract.create({
        data: { ...derived, data: doc as Prisma.InputJsonValue },
        include: { employee: true, client: true },
      });
    });
    return this.toDoc(row);
  }

  /** Remplacement complet (sémantique de saveContract sur un contrat existant). */
  async replace(id: string, input: unknown) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Aucun contrat trouvé avec l'ID ${id}`);
    const doc = this.sanitize(input);
    if (!toInt(doc.contractNumber) && existing.contractNumber) {
      doc.contractNumber = existing.contractNumber;
    }
    const row = await this.prisma.contract.update({
      where: { id },
      data: { ...(await this.derive(doc)), data: doc as Prisma.InputJsonValue },
      include: { employee: true, client: true },
    });
    return this.toDoc(row);
  }

  /** Mise à jour partielle par fusion (sémantique de DatabaseService.updateContract). */
  async update(id: string, input: unknown) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Aucun contrat trouvé avec l'ID ${id}`);
    const merged = { ...(existing.data as Record<string, any>), ...cleanDocument(input) };
    const doc = this.sanitize(merged);
    const row = await this.prisma.contract.update({
      where: { id },
      data: { ...(await this.derive(doc)), data: doc as Prisma.InputJsonValue },
      include: { employee: true, client: true },
    });
    return this.toDoc(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Aucun contrat trouvé avec l'ID ${id}`);
    await this.prisma.contract.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Nettoyage des anciens contrats qui embarquaient les images de signature.
   * Conserve signatureId / stampId, supprime les objets signature / stamp.
   */
  async cleanup() {
    const rows = await this.prisma.contract.findMany();
    let contractsUpdated = 0;
    let spaceSaved = 0;
    for (const row of rows) {
      const data = isPlainObject(row.data) ? row.data : {};
      let modified = false;
      for (const key of ['signature', 'stamp']) {
        if (isPlainObject(data[key])) {
          if (typeof data[key].imageData === 'string') spaceSaved += data[key].imageData.length;
          delete data[key];
          modified = true;
        }
      }
      for (const key of ['client', 'employee', 'securityMeasuresList']) {
        if (data[key] !== undefined) {
          delete data[key];
          modified = true;
        }
      }
      if (modified) {
        contractsUpdated++;
        await this.prisma.contract.update({ where: { id: row.id }, data: { data: data as Prisma.InputJsonValue } });
      }
    }
    return {
      success: true,
      contractsTotal: rows.length,
      contractsUpdated,
      spaceSavedBytes: spaceSaved,
      spaceSavedKB: Math.round(spaceSaved / 1024),
      spaceSavedMB: Math.round((spaceSaved / (1024 * 1024)) * 100) / 100,
    };
  }

  async insertWithId(tx: Prisma.TransactionClient, raw: Record<string, any>) {
    const doc = this.sanitize(raw);
    const id = raw.id ? String(raw.id) : undefined;
    const derived = {
      contractNumber: toInt(pick(doc, 'contractNumber', 'contract_number')),
      title: toStr(doc.title),
      employeeId: toInt(pick(doc, 'employeeId', 'employee_id')),
      clientId: toInt(pick(doc, 'clientId', 'client_id')),
      startDate: toDateStr(pick(doc, 'startDate', 'start_date')),
      endDate: toDateStr(pick(doc, 'endDate', 'end_date')),
      location: toStr(doc.location),
      hourlyRate: toFloat(pick(doc, 'hourlyRate', 'hourly_rate')),
      billingRate: toFloat(pick(doc, 'billingRate', 'billing_rate')),
      signatureId: toInt(doc.signatureId),
      stampId: toInt(doc.stampId),
    };
    // Les liens vers des employés / clients absents de la sauvegarde sont neutralisés.
    if (derived.employeeId !== null) {
      const e = await tx.employee.findUnique({ where: { id: derived.employeeId }, select: { id: true } });
      if (!e) derived.employeeId = null;
    }
    if (derived.clientId !== null) {
      const c = await tx.client.findUnique({ where: { id: derived.clientId }, select: { id: true } });
      if (!c) derived.clientId = null;
    }
    await tx.contract.create({
      data: {
        id,
        ...derived,
        data: doc as Prisma.InputJsonValue,
        createdAt: raw.createdAt || raw.created_at ? new Date(raw.createdAt || raw.created_at) : undefined,
      },
    });
  }
}
