// src/modules/payroll/PayrollForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import DatabaseService from '../../services/DatabaseService';
import PayrollService from './PayrollService';

const SECTIONS = [
  'GAINS',
  'SANTE',
  'ACCIDENT DU TRAVAIL-MALADIES PROFESSIONNELLES',
  'RETRAITE',
  'FAMILLE',
  'ASSURANCE CHOMAGE',
  'AUTRES CONTRIBUTIONS DUES PAR L\'EMPLOYEUR',
  'CSG/CRDS',
  'EXONERATIONS, ECRETEMENTS ET ALLEGEMENTS DE COTISATIONS',
  'AUTRE',
];

const emptyLine = (section = 'GAINS') => ({
  section,
  libelle: '',
  base: '',
  taux: '',
  montant: '',
  chargesPatronales: '',
});

const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (n) => num(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toISODate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const PayrollForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: '',
    paymentDate: '',
    paymentMethod: 'Virement',
    lines: [emptyLine('GAINS')],
    tax: {
      netImposable: '',
      pasBase: '',
      pasTaux: '',
      pasMontant: '',
      cumulAnnuel: '',
    },
    cumulsPeriod: {
      plafondSS: '',
      brut: '',
      brutAbattu: '',
      cotisSal: '',
      cotisPat: '',
      hresTrav: '',
      hresPay: '',
      hresSupp: '',
    },
  });

  const [annualCumuls, setAnnualCumuls] = useState({
    plafondSS: 0, brut: 0, brutAbattu: 0, cotisSal: 0, cotisPat: 0,
    hresTrav: 0, hresPay: 0, hresSupp: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const emps = await DatabaseService.getEmployees();
        setEmployees(emps);
        if (isEdit) {
          const p = await PayrollService.getById(id);
          setForm({
            employeeId: p.employeeId || '',
            periodStart: toISODate(p.periodStart),
            periodEnd: toISODate(p.periodEnd),
            paymentDate: toISODate(p.paymentDate),
            paymentMethod: p.paymentMethod || 'Virement',
            lines: p.lines && p.lines.length ? p.lines : [emptyLine('GAINS')],
            tax: { ...form.tax, ...(p.tax || {}) },
            cumulsPeriod: { ...form.cumulsPeriod, ...(p.cumuls?.period || {}) },
          });
        }
      } catch (e) {
        console.error(e);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Charger les cumuls annuels quand salarié + périodeEnd changent
  useEffect(() => {
    const loadAnnual = async () => {
      if (!form.employeeId || !form.periodEnd) {
        setAnnualCumuls({ plafondSS: 0, brut: 0, brutAbattu: 0, cotisSal: 0, cotisPat: 0, hresTrav: 0, hresPay: 0, hresSupp: 0 });
        return;
      }
      const year = new Date(form.periodEnd).getFullYear();
      const cumuls = await PayrollService.getAnnualCumuls(form.employeeId, year, isEdit ? id : null);
      setAnnualCumuls(cumuls);
    };
    loadAnnual();
  }, [form.employeeId, form.periodEnd, id, isEdit]);

  // Totaux dérivés
  const totals = useMemo(() => {
    const gains = form.lines.filter((l) => l.section === 'GAINS');
    const cotis = form.lines.filter((l) => l.section !== 'GAINS');

    const brut = gains.reduce((s, l) => s + num(l.montant), 0);
    const cotisSal = cotis.reduce((s, l) => s + num(l.montant), 0);
    const cotisPat = form.lines.reduce((s, l) => s + num(l.chargesPatronales), 0);
    const netSocial = brut + cotisSal; // cotisSal est négatif côté salarié
    const netAvantImpot = netSocial;
    const pas = num(form.tax.pasMontant);
    const netAPayer = netAvantImpot - pas;
    const totalVerseEmployeur = brut + cotisPat;

    return { brut, cotisSal, cotisPat, netSocial, netAvantImpot, netAPayer, totalVerseEmployeur };
  }, [form.lines, form.tax.pasMontant]);

  // Cumuls annuels affichés = annuel précédent + période courante
  const cumulsAnnualDisplayed = useMemo(() => ({
    plafondSS: annualCumuls.plafondSS + num(form.cumulsPeriod.plafondSS),
    brut: annualCumuls.brut + num(form.cumulsPeriod.brut),
    brutAbattu: annualCumuls.brutAbattu + num(form.cumulsPeriod.brutAbattu),
    cotisSal: annualCumuls.cotisSal + num(form.cumulsPeriod.cotisSal),
    cotisPat: annualCumuls.cotisPat + num(form.cumulsPeriod.cotisPat),
    hresTrav: annualCumuls.hresTrav + num(form.cumulsPeriod.hresTrav),
    hresPay: annualCumuls.hresPay + num(form.cumulsPeriod.hresPay),
    hresSupp: annualCumuls.hresSupp + num(form.cumulsPeriod.hresSupp),
  }), [annualCumuls, form.cumulsPeriod]);

  const updateLine = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    }));
  };

  const addLine = (section = 'GAINS') => {
    setForm((f) => ({ ...f, lines: [...f.lines, emptyLine(section)] }));
  };

  const removeLine = (idx) => {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      toast.error('Sélectionne un salarié');
      return;
    }
    if (!form.periodStart || !form.periodEnd) {
      toast.error('Période obligatoire');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        employeeId: Number(form.employeeId),
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        lines: form.lines,
        totals,
        tax: form.tax,
        cumuls: {
          period: form.cumulsPeriod,
          annual: cumulsAnnualDisplayed,
        },
        status: 'draft',
      };
      let saved;
      if (isEdit) {
        saved = await PayrollService.update(id, payload);
        toast.success('Bulletin mis à jour');
      } else {
        saved = await PayrollService.create(payload);
        toast.success('Bulletin créé');
      }
      navigate(`/payroll/${saved.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Chargement…</div>;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button type="button" onClick={() => navigate('/payroll')} className="mr-3 text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Modifier le bulletin' : 'Nouveau bulletin de paie'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Bloc en-tête */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">En-tête</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salarié *</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={employees.length === 0}
            >
              <option value="">
                {employees.length === 0 ? '— Aucun salarié, créez-en d\'abord —' : '— Sélectionner —'}
              </option>
              {employees.map((emp) => {
                const first = emp.firstName || emp.firstname || '';
                const last = emp.lastName || emp.lastname || '';
                const fullName = `${first} ${last}`.trim() || `Salarié #${emp.id}`;
                return (
                  <option key={emp.id} value={emp.id}>
                    {fullName} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''}
                  </option>
                );
              })}
            </select>
            {employees.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Va dans <strong>Employés</strong> pour créer un salarié.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
            <input
              type="text"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Période du *</label>
            <input
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Période au *</label>
            <input
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Lignes de cotisations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Lignes du bulletin</h2>
          <button
            type="button"
            onClick={() => addLine('GAINS')}
            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" /> Ajouter une ligne
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-2 py-2 text-left">Section</th>
                <th className="px-2 py-2 text-left">Libellé</th>
                <th className="px-2 py-2 text-right w-24">Base</th>
                <th className="px-2 py-2 text-right w-20">Taux</th>
                <th className="px-2 py-2 text-right w-24">Montant sal.</th>
                <th className="px-2 py-2 text-right w-28">Charges pat.</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-2 py-1">
                    <select
                      value={line.section}
                      onChange={(e) => updateLine(idx, 'section', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={line.libelle}
                      onChange={(e) => updateLine(idx, 'libelle', e.target.value)}
                      placeholder="ex: Salaire horaire"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={line.base}
                      onChange={(e) => updateLine(idx, 'base', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.0001"
                      value={line.taux}
                      onChange={(e) => updateLine(idx, 'taux', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={line.montant}
                      onChange={(e) => updateLine(idx, 'montant', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={line.chargesPatronales}
                      onChange={(e) => updateLine(idx, 'chargesPatronales', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button type="button" onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Astuce : utilise la section <strong>GAINS</strong> pour les rubriques de salaire/indemnités/heures sup,
          les autres sections pour les cotisations. Mets le montant salarié en <strong>négatif</strong> pour une déduction.
        </p>
      </div>

      {/* Totaux */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Totaux (calculés)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-gray-500">Total Brut</div><div className="font-bold">{fmt(totals.brut)} €</div></div>
          <div><div className="text-gray-500">Total cotisations sal.</div><div className="font-bold">{fmt(totals.cotisSal)} €</div></div>
          <div><div className="text-gray-500">Charges patronales</div><div className="font-bold">{fmt(totals.cotisPat)} €</div></div>
          <div><div className="text-gray-500">Net social</div><div className="font-bold">{fmt(totals.netSocial)} €</div></div>
          <div><div className="text-gray-500">Net avant impôt</div><div className="font-bold">{fmt(totals.netAvantImpot)} €</div></div>
          <div><div className="text-gray-500">Net à payer</div><div className="font-bold text-blue-700">{fmt(totals.netAPayer)} €</div></div>
          <div><div className="text-gray-500">Total versé employeur</div><div className="font-bold">{fmt(totals.totalVerseEmployeur)} €</div></div>
        </div>
      </div>

      {/* Impôt sur le revenu */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Impôt sur le revenu (PAS)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['netImposable', 'pasBase', 'pasTaux', 'pasMontant', 'cumulAnnuel'].map((k) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{k}</label>
              <input
                type="number"
                step="0.01"
                value={form.tax[k]}
                onChange={(e) => setForm({ ...form, tax: { ...form.tax, [k]: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Cumuls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Cumuls de la période</h2>
        <p className="text-xs text-gray-500 mb-3">
          La colonne <strong>annuel</strong> est calculée automatiquement (bulletins précédents de la même année + valeurs de la période ci-dessous).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2 text-right">Plafond SS</th>
                <th className="px-2 py-2 text-right">Brut</th>
                <th className="px-2 py-2 text-right">Brut abattu</th>
                <th className="px-2 py-2 text-right">Cotis Sal.</th>
                <th className="px-2 py-2 text-right">Cotis Pat.</th>
                <th className="px-2 py-2 text-right">Hres Trav.</th>
                <th className="px-2 py-2 text-right">Hres Pay.</th>
                <th className="px-2 py-2 text-right">Hres Supp.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-2 py-1 font-medium">Période</td>
                {['plafondSS', 'brut', 'brutAbattu', 'cotisSal', 'cotisPat', 'hresTrav', 'hresPay', 'hresSupp'].map((k) => (
                  <td key={k} className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={form.cumulsPeriod[k]}
                      onChange={(e) => setForm({ ...form, cumulsPeriod: { ...form.cumulsPeriod, [k]: e.target.value } })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-t bg-blue-50">
                <td className="px-2 py-1 font-medium">Annuel (auto)</td>
                {['plafondSS', 'brut', 'brutAbattu', 'cotisSal', 'cotisPat', 'hresTrav', 'hresPay', 'hresSupp'].map((k) => (
                  <td key={k} className="px-2 py-1 text-right font-medium">{fmt(cumulsAnnualDisplayed[k])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
};

export default PayrollForm;
