// src/modules/payroll/PayrollService.js
import DatabaseService from '../../services/DatabaseService';

const ENTITY = 'payslips';

class PayrollService {
  constructor() {
    this.db = DatabaseService;
  }

  async getAll(filters = {}) {
    const items = await this.db.getAll(ENTITY, filters, 'periodEnd', 'DESC');
    for (const p of items) {
      if (p.employeeId) {
        try {
          const emp = await this.db.getEmployeeById(p.employeeId);
          p.employeeFirstname = emp.firstName || emp.firstname || '';
          p.employeeLastname = emp.lastName || emp.lastname || '';
        } catch (e) {
          // employé supprimé — on continue
        }
      }
    }
    return items;
  }

  async getById(id) {
    const p = await this.db.getById(ENTITY, id);
    if (p.employeeId) {
      try {
        p.employee = await this.db.getEmployeeById(p.employeeId);
      } catch (e) {
        p.employee = null;
      }
    }
    return p;
  }

  async create(data) {
    return this.db.create(ENTITY, this.normalize(data));
  }

  async update(id, data) {
    return this.db.update(ENTITY, id, this.normalize(data));
  }

  async delete(id) {
    return this.db.delete(ENTITY, id);
  }

  async getByEmployee(employeeId) {
    return this.getAll({ employeeId: Number(employeeId) });
  }

  // Cumuls annuels (période + annuel) calculés depuis les bulletins précédents
  // de l'année courante (même salarié, périodeEnd dans l'année cible, hors bulletin en cours)
  async getAnnualCumuls(employeeId, year, excludePayslipId = null) {
    const all = await this.db.getAll(ENTITY, { employeeId: Number(employeeId) });
    const previous = all.filter((p) => {
      if (excludePayslipId && p.id === Number(excludePayslipId)) return false;
      if (!p.periodEnd) return false;
      return new Date(p.periodEnd).getFullYear() === Number(year);
    });

    const sum = (key) => previous.reduce((acc, p) => acc + (parseFloat(p.cumuls?.period?.[key]) || 0), 0);

    return {
      plafondSS: sum('plafondSS'),
      brut: sum('brut'),
      brutAbattu: sum('brutAbattu'),
      cotisSal: sum('cotisSal'),
      cotisPat: sum('cotisPat'),
      hresTrav: sum('hresTrav'),
      hresPay: sum('hresPay'),
      hresSupp: sum('hresSupp'),
    };
  }

  normalize(data) {
    return {
      ...data,
      employeeId: data.employeeId ? Number(data.employeeId) : null,
      periodStart: data.periodStart || null,
      periodEnd: data.periodEnd || null,
      paymentDate: data.paymentDate || null,
      paymentMethod: data.paymentMethod || 'Virement',
      lines: Array.isArray(data.lines) ? data.lines : [],
      totals: data.totals || {},
      cumuls: data.cumuls || { period: {}, annual: {} },
      tax: data.tax || {},
      status: data.status || 'draft',
    };
  }
}

export default new PayrollService();
