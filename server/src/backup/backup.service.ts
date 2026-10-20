import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from '../employees/employees.service';
import { ClientsService } from '../clients/clients.service';
import { ContractsService } from '../contracts/contracts.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { InvoicesService } from '../invoices/invoices.service';
import { PayslipsService } from '../payslips/payslips.service';
import { REFERENCE_KINDS, SettingsService } from '../settings/settings.service';
import { KvService } from '../kv/kv.service';
import { CountersService, CONTRACT_COUNTER, INVOICE_COUNTER } from '../counters/counters.service';
import { isPlainObject, toInt } from '../common/utils/coerce';
import { numericDoc, resyncSequence, uuidDoc } from '../common/utils/documents';

export const BACKUP_VERSION = 2;

/**
 * Sauvegarde / restauration complètes.
 * L'ancienne sauvegarde n'exportait que employés, clients et contrats ;
 * la version 2 couvre toutes les données (pointages, factures, bulletins,
 * paramètres, signatures, compteurs, clé/valeur). Le format historique reste importable.
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly employees: EmployeesService,
    private readonly clients: ClientsService,
    private readonly contracts: ContractsService,
    private readonly timeEntries: TimeEntriesService,
    private readonly invoices: InvoicesService,
    private readonly payslips: PayslipsService,
    private readonly settings: SettingsService,
    private readonly kv: KvService,
    private readonly counters: CountersService,
  ) {}

  async exportAll() {
    const [employees, clients, contracts, timeEntries, invoices, payslips, signatures, companySettings, lists, kv, counters] =
      await Promise.all([
        this.prisma.employee.findMany({ orderBy: { id: 'asc' } }),
        this.prisma.client.findMany({ orderBy: { id: 'asc' } }),
        this.prisma.contract.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.timeEntry.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.invoice.findMany({ orderBy: { id: 'asc' } }),
        this.prisma.payslip.findMany({ orderBy: { id: 'asc' } }),
        this.settings.getSignatures(),
        this.settings.getCompany(),
        this.settings.getAllLists(),
        this.kv.all(),
        this.counters.list(),
      ]);

    const counterMap: Record<string, number> = {};
    for (const c of counters) counterMap[c.name] = c.value;

    return {
      version: BACKUP_VERSION,
      employees: employees.map(numericDoc),
      clients: clients.map(numericDoc),
      contracts: contracts.map(uuidDoc),
      timeEntries: timeEntries.map(uuidDoc),
      invoices: invoices.map(numericDoc),
      payslips: payslips.map(numericDoc),
      settings: { company: companySettings, lists, signatures },
      kv,
      counters: counterMap,
      metadata: {
        lastId_employees: employees.reduce((m, e) => Math.max(m, e.id), 0),
        lastId_clients: clients.reduce((m, c) => Math.max(m, c.id), 0),
        lastId_contracts: contracts.length,
        exportDate: new Date().toISOString(),
      },
    };
  }

  /** Restauration : remplace toutes les données (comme l'ancien importData). */
  async importAll(payload: unknown) {
    if (!isPlainObject(payload) || !Array.isArray(payload.employees) || !Array.isArray(payload.clients) || !Array.isArray(payload.contracts)) {
      throw new BadRequestException('Les données importées sont incorrectes ou incomplètes');
    }
    const data = payload as Record<string, any>;
    const timeEntries: any[] = Array.isArray(data.timeEntries) ? data.timeEntries : [];
    const invoices: any[] = Array.isArray(data.invoices) ? data.invoices : [];
    const payslips: any[] = Array.isArray(data.payslips) ? data.payslips : [];
    const settings = isPlainObject(data.settings) ? data.settings : {};
    const lists = isPlainObject(settings.lists) ? settings.lists : {};
    const signatures: any[] = Array.isArray(settings.signatures) ? settings.signatures : [];
    const kv = isPlainObject(data.kv) ? data.kv : {};
    const counters = isPlainObject(data.counters) ? data.counters : {};

    const summary = { employees: 0, clients: 0, contracts: 0, timeEntries: 0, invoices: 0, payslips: 0, signatures: 0 };

    await this.prisma.$transaction(
      async (tx) => {
        // Purge dans l'ordre des dépendances
        await tx.timeEntry.deleteMany();
        await tx.invoice.deleteMany();
        await tx.payslip.deleteMany();
        await tx.contract.deleteMany();
        await tx.employee.deleteMany();
        await tx.client.deleteMany();
        if (data.version >= 2) {
          await tx.referenceItem.deleteMany();
          await tx.signature.deleteMany();
          await tx.companySettings.deleteMany();
          await tx.kvEntry.deleteMany();
          await tx.counter.deleteMany();
        }

        for (const e of data.employees) {
          if (!isPlainObject(e) || toInt(e.id) === null) continue;
          await this.employees.insertWithId(tx, e);
          summary.employees++;
        }
        for (const c of data.clients) {
          if (!isPlainObject(c) || toInt(c.id) === null) continue;
          await this.clients.insertWithId(tx, c);
          summary.clients++;
        }
        for (const c of data.contracts) {
          if (!isPlainObject(c)) continue;
          await this.contracts.insertWithId(tx, c);
          summary.contracts++;
        }
        for (const t of timeEntries) {
          if (!isPlainObject(t)) continue;
          await this.timeEntries.insertWithId(tx, t);
          summary.timeEntries++;
        }
        for (const i of invoices) {
          if (!isPlainObject(i) || toInt(i.id) === null) continue;
          await this.invoices.insertWithId(tx, i);
          summary.invoices++;
        }
        for (const p of payslips) {
          if (!isPlainObject(p) || toInt(p.id) === null) continue;
          await this.payslips.insertWithId(tx, p);
          summary.payslips++;
        }

        if (data.version >= 2) {
          if (isPlainObject(settings.company)) {
            await tx.companySettings.create({ data: { id: 1, data: settings.company as Prisma.InputJsonValue } });
          }
          for (const kind of REFERENCE_KINDS) {
            if (Array.isArray(lists[kind])) await this.settings.replaceList(kind, lists[kind], tx);
          }
          for (const s of signatures) {
            if (!isPlainObject(s) || toInt(s.id) === null) continue;
            await this.settings.insertSignatureWithId(tx, s);
            summary.signatures++;
          }
          for (const [key, value] of Object.entries(kv)) await this.kv.set(key, value, tx);
          for (const [name, value] of Object.entries(counters)) {
            const v = toInt(value);
            if (v !== null) await this.counters.set(name, v, tx);
          }
        }

        // Compteurs cohérents avec les données importées
        const maxContract = data.contracts.reduce((m: number, c: any) => Math.max(m, toInt(c?.contractNumber) ?? 0), 0);
        const currentContract = toInt(counters[CONTRACT_COUNTER]) ?? 0;
        await this.counters.set(CONTRACT_COUNTER, Math.max(currentContract, maxContract, 100000), tx);
        if (toInt(counters[INVOICE_COUNTER]) === null) {
          const maxInvoice = invoices.reduce((m: number, i: any) => {
            const match = String(i?.invoiceNumber || i?.invoice_number || '').match(/(\d+)$/);
            return Math.max(m, match ? parseInt(match[1], 10) : 0);
          }, 0);
          await this.counters.set(INVOICE_COUNTER, maxInvoice, tx);
        }
      },
      { timeout: 120000, maxWait: 10000 },
    );

    for (const table of ['employees', 'clients', 'invoices', 'payslips', 'signatures']) {
      await resyncSequence(this.prisma, table);
    }

    this.logger.log(`Restauration terminée : ${JSON.stringify(summary)}`);
    return { success: true, summary };
  }
}
