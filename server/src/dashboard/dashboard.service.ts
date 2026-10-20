import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractsService } from '../contracts/contracts.service';
import { toFloat } from '../common/utils/coerce';

/**
 * Statistiques du tableau de bord. Reprend les formules de l'ancien
 * DatabaseService.getDashboardStats en lisant les champs réels des contrats
 * (startDate, endDate, billingRate) : l'ancienne version lisait des champs
 * snake_case inexistants et renvoyait donc des zéros.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contracts: ContractsService,
  ) {}

  private parseDate(value: unknown): Date | null {
    if (!value) return null;
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  async endingSoon() {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    const contracts = await this.contracts.findAll({ filters: {}, direction: 'ASC' });
    return contracts
      .filter((c) => {
        const end = this.parseDate(c.endDate);
        return end !== null && end >= today && end <= limit;
      })
      .sort((a, b) => (this.parseDate(a.endDate)?.getTime() ?? 0) - (this.parseDate(b.endDate)?.getTime() ?? 0));
  }

  async stats() {
    const [employees, clients, contracts] = await Promise.all([
      this.prisma.employee.findMany({ select: { status: true } }),
      this.prisma.client.findMany({ select: { status: true } }),
      this.contracts.findAll({ filters: {}, direction: 'ASC' }),
    ]);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endingSoon = await this.endingSoon();

    const contractsThisMonth = contracts.filter((c) => {
      const start = this.parseDate(c.startDate);
      return start !== null && start >= firstDayOfMonth && start <= today;
    }).length;

    let revenueThisMonth = 0;
    for (const c of contracts) {
      const rate = toFloat(c.billingRate);
      const start = this.parseDate(c.startDate);
      if (!rate || !start) continue;
      if (start >= firstDayOfMonth && start <= today) {
        const daysActive = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        revenueThisMonth += Math.min(daysActive, 22) * 7 * rate;
      } else if (start < firstDayOfMonth) {
        const days = Math.ceil((today.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        revenueThisMonth += Math.min(days, 22) * 7 * rate;
      }
    }

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === 'active').length,
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.status === 'active').length,
      totalContracts: contracts.length,
      activeContracts: contracts.length,
      endingSoonContracts: endingSoon.length,
      contractsThisMonth,
      revenueThisMonth,
    };
  }
}
