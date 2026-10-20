import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CountersService } from '../counters/counters.service';
import { pick, toBool, toDateStr, toFloat, toInt, toStr } from '../common/utils/coerce';
import { cleanDocument, numericDoc, resolveClientId } from '../common/utils/documents';
import { applyFilters, ListQuery, sortItems } from '../common/utils/query';

type InvoiceRow = Prisma.InvoiceGetPayload<{ include: { client: true } }>;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly counters: CountersService,
  ) {}

  /** Normalisation des noms de champs (reprise de DatabaseService.createInvoice / updateInvoice). */
  private normalize(doc: Record<string, any>, isCreate: boolean) {
    const out = { ...doc };
    out.client_id = doc.clientId || doc.client_id;
    out.invoice_number = doc.invoiceNumber || doc.invoice_number;
    out.invoice_date = doc.invoiceDate || doc.invoice_date;
    out.due_date = doc.dueDate || doc.due_date;
    out.period_start = doc.periodStart || doc.period_start;
    out.period_end = doc.periodEnd || doc.period_end;
    out.total_amount = doc.totalAmount || doc.total_amount || 0;
    out.work_periods = doc.workPeriods || doc.work_periods || [];
    if (isCreate) out.status = doc.status || 'draft';
    delete out.client; // objet client enrichi à la lecture, jamais stocké
    return out;
  }

  private async derive(doc: Record<string, any>) {
    return {
      invoiceNumber: toStr(pick(doc, 'invoiceNumber', 'invoice_number')),
      clientId: await resolveClientId(this.prisma, pick(doc, 'clientId', 'client_id')),
      status: toStr(doc.status) || 'draft',
      invoiceDate: toDateStr(pick(doc, 'invoiceDate', 'invoice_date')),
      dueDate: toDateStr(pick(doc, 'dueDate', 'due_date')),
      periodStart: toDateStr(pick(doc, 'periodStart', 'period_start')),
      periodEnd: toDateStr(pick(doc, 'periodEnd', 'period_end')),
      totalAmount: toFloat(pick(doc, 'totalAmount', 'total_amount')),
      isFinalized: toBool(doc.isFinalized),
    };
  }

  /** Enrichissement liste : champs client à plat (comme DatabaseService.getInvoices). */
  private toListDoc(row: InvoiceRow) {
    const doc: Record<string, any> = numericDoc(row);
    if (row.client) {
      const client = numericDoc(row.client) as Record<string, any>;
      doc.clientName = client.contactName || client.contact_name || '';
      doc.clientCompany = client.companyName || client.company_name || '';
      doc.clientEmail = client.email || '';
      doc.clientPhone = client.phone || '';
      doc.clientAddress = client.address || '';
      doc.clientCity = client.city || '';
      doc.clientPostalCode = client.postalCode || client.postal_code || '';
    }
    return doc;
  }

  /** Enrichissement détail : objet client complet (comme DatabaseService.getInvoiceById). */
  private toDetailDoc(row: InvoiceRow) {
    const doc: Record<string, any> = numericDoc(row);
    if (row.client) {
      const client = numericDoc(row.client) as Record<string, any>;
      doc.client = client;
      doc.clientName = client.contactName || client.contact_name || '';
      doc.clientCompany = client.companyName || client.company_name || '';
    }
    return doc;
  }

  async findAll(query: ListQuery) {
    const rows = await this.prisma.invoice.findMany({
      include: { client: true },
      orderBy: [{ invoiceDate: 'desc' }, { id: 'desc' }],
    });
    const docs = applyFilters(rows.map((r) => this.toListDoc(r)), query.filters);
    return query.order ? sortItems(docs, query.order, query.direction) : docs;
  }

  async findOne(id: number) {
    const row = await this.prisma.invoice.findUnique({ where: { id }, include: { client: true } });
    if (!row) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans invoices`);
    return this.toDetailDoc(row);
  }

  async create(input: unknown) {
    const doc = this.normalize(cleanDocument(input), true);
    const row = await this.prisma.invoice.create({
      data: { ...(await this.derive(doc)), data: doc as Prisma.InputJsonValue },
      include: { client: true },
    });
    return this.toDetailDoc(row);
  }

  async update(id: number, input: unknown) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans invoices`);
    const merged = { ...(existing.data as Record<string, any>), ...this.normalize(cleanDocument(input), false) };
    const row = await this.prisma.invoice.update({
      where: { id },
      data: { ...(await this.derive(merged)), data: merged as Prisma.InputJsonValue },
      include: { client: true },
    });
    return this.toDetailDoc(row);
  }

  async updateStatus(id: number, status: string) {
    return this.update(id, { status, updated_at: new Date().toISOString() });
  }

  async remove(id: number) {
    const existing = await this.prisma.invoice.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Aucun élément trouvé avec l'ID ${id} dans invoices`);
    await this.prisma.invoice.delete({ where: { id } });
    return { success: true };
  }

  async nextNumber() {
    return { invoiceNumber: await this.counters.nextInvoiceNumber() };
  }

  async statistics() {
    const invoices = await this.findAll({ filters: {}, direction: 'ASC' });
    const amount = (i: Record<string, any>) => parseFloat(i.total_amount || i.totalAmount) || 0;
    return {
      total: invoices.length,
      draft: invoices.filter((i) => i.status === 'draft').length,
      sent: invoices.filter((i) => i.status === 'sent').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      rejected: invoices.filter((i) => i.status === 'rejected').length,
      totalAmount: invoices.reduce((s, i) => s + amount(i), 0),
      paidAmount: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + amount(i), 0),
      pendingAmount: invoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((s, i) => s + amount(i), 0),
    };
  }

  async insertWithId(tx: Prisma.TransactionClient, raw: Record<string, any>) {
    const doc = this.normalize(cleanDocument(raw), true);
    const derived = {
      invoiceNumber: toStr(pick(doc, 'invoiceNumber', 'invoice_number')),
      clientId: toInt(pick(doc, 'clientId', 'client_id')),
      status: toStr(doc.status) || 'draft',
      invoiceDate: toDateStr(pick(doc, 'invoiceDate', 'invoice_date')),
      dueDate: toDateStr(pick(doc, 'dueDate', 'due_date')),
      periodStart: toDateStr(pick(doc, 'periodStart', 'period_start')),
      periodEnd: toDateStr(pick(doc, 'periodEnd', 'period_end')),
      totalAmount: toFloat(pick(doc, 'totalAmount', 'total_amount')),
      isFinalized: toBool(doc.isFinalized),
    };
    if (derived.clientId !== null && !(await tx.client.findUnique({ where: { id: derived.clientId }, select: { id: true } }))) derived.clientId = null;
    await tx.invoice.create({
      data: {
        id: Number(raw.id),
        ...derived,
        data: doc as Prisma.InputJsonValue,
        createdAt: raw.created_at ? new Date(raw.created_at) : undefined,
      },
    });
  }
}
