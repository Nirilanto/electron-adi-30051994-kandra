// src/modules/payroll/PayrollProfile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  DocumentArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import PayrollService from './PayrollService';
import SettingsService from '../settings/SettingsService';

const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
const fmt = (n) => num(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const PayrollProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await PayrollService.getById(id);
        setPayslip(p);
      } catch (e) {
        console.error(e);
        toast.error('Bulletin introuvable');
        navigate('/payroll');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleGeneratePDF = async () => {
    if (!window.electron?.generatePDF) {
      toast.error('Génération PDF disponible uniquement dans l\'application');
      return;
    }
    setGenerating(true);
    try {
      const company = await SettingsService.getCompanySettings();
      const data = buildPdfData(payslip, company);
      const fileName = `bulletin_${payslip.employee?.lastname || 'salarie'}_${(payslip.periodEnd || '').replace(/-/g, '')}.pdf`;
      const result = await window.electron.generatePDF('payslip', data, fileName);
      if (result.success) {
        toast.success('PDF généré');
      } else if (result.reason !== 'canceled') {
        toast.error('Erreur PDF : ' + (result.error || 'inconnue'));
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce bulletin ?')) return;
    try {
      await PayrollService.delete(id);
      toast.success('Bulletin supprimé');
      navigate('/payroll');
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Chargement…</div>;
  if (!payslip) return null;

  const rawE = payslip.employee || {};
  const e = {
    ...rawE,
    firstname: rawE.firstName || rawE.firstname || '',
    lastname: rawE.lastName || rawE.lastname || '',
    postalCode: rawE.postalCode || rawE.zipCode || rawE.postal_code || '',
  };
  const t = payslip.totals || {};
  const tax = payslip.tax || {};
  const cP = payslip.cumuls?.period || {};
  const cA = payslip.cumuls?.annual || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate('/payroll')} className="mr-3 text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Bulletin — {e.firstname} {e.lastname}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {generating ? 'Génération…' : 'Générer PDF'}
          </button>
          <button
            onClick={() => navigate(`/payroll/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            <PencilSquareIcon className="h-5 w-5 mr-2" /> Modifier
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            <TrashIcon className="h-5 w-5 mr-2" /> Supprimer
          </button>
        </div>
      </div>

      {/* Infos en-tête */}
      <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Salarié</div>
          <div className="font-medium">{e.firstname} {e.lastname}</div>
          <div className="text-gray-600">{e.address}</div>
          <div className="text-gray-600">{e.postalCode} {e.city}</div>
        </div>
        <div>
          <div className="text-gray-500">Période</div>
          <div className="font-medium">{fmtDate(payslip.periodStart)} → {fmtDate(payslip.periodEnd)}</div>
          <div className="text-gray-500 mt-2">Paiement</div>
          <div className="font-medium">{fmtDate(payslip.paymentDate)} ({payslip.paymentMethod})</div>
        </div>
        <div>
          <div className="text-gray-500">Net à payer</div>
          <div className="text-2xl font-bold text-blue-700">{fmt(t.netAPayer)} €</div>
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Lignes</h2>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs">
            <tr>
              <th className="px-2 py-2 text-left">Section</th>
              <th className="px-2 py-2 text-left">Libellé</th>
              <th className="px-2 py-2 text-right">Base</th>
              <th className="px-2 py-2 text-right">Taux</th>
              <th className="px-2 py-2 text-right">Montant sal.</th>
              <th className="px-2 py-2 text-right">Charges pat.</th>
            </tr>
          </thead>
          <tbody>
            {(payslip.lines || []).map((l, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1 text-xs text-gray-500">{l.section}</td>
                <td className="px-2 py-1">{l.libelle}</td>
                <td className="px-2 py-1 text-right">{l.base !== '' ? fmt(l.base) : ''}</td>
                <td className="px-2 py-1 text-right">{l.taux !== '' ? fmt(l.taux) : ''}</td>
                <td className="px-2 py-1 text-right">{l.montant !== '' ? fmt(l.montant) : ''}</td>
                <td className="px-2 py-1 text-right">{l.chargesPatronales !== '' ? fmt(l.chargesPatronales) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cumuls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Cumuls</h2>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th></th>
              {['plafondSS', 'brut', 'brutAbattu', 'cotisSal', 'cotisPat', 'hresTrav', 'hresPay', 'hresSupp'].map((k) => (
                <th key={k} className="px-2 py-2 text-right">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-2 py-1 font-medium">Période</td>
              {['plafondSS', 'brut', 'brutAbattu', 'cotisSal', 'cotisPat', 'hresTrav', 'hresPay', 'hresSupp'].map((k) => (
                <td key={k} className="px-2 py-1 text-right">{fmt(cP[k])}</td>
              ))}
            </tr>
            <tr className="border-t bg-blue-50">
              <td className="px-2 py-1 font-medium">Annuel</td>
              {['plafondSS', 'brut', 'brutAbattu', 'cotisSal', 'cotisPat', 'hresTrav', 'hresPay', 'hresSupp'].map((k) => (
                <td key={k} className="px-2 py-1 text-right">{fmt(cA[k])}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Impôt */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Impôt sur le revenu</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          {['netImposable', 'pasBase', 'pasTaux', 'pasMontant', 'cumulAnnuel'].map((k) => (
            <div key={k}>
              <div className="text-gray-500 text-xs">{k}</div>
              <div className="font-medium">{fmt(tax[k])}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Construit le payload envoyé au handler PDF (templates Handlebars)
function buildPdfData(payslip, company) {
  const rawE = payslip.employee || {};
  const e = {
    ...rawE,
    firstname: rawE.firstName || rawE.firstname || '',
    lastname: rawE.lastName || rawE.lastname || '',
    postalCode: rawE.postalCode || rawE.zipCode || rawE.postal_code || '',
  };
  const t = payslip.totals || {};
  return {
    company: {
      name: company?.name || '',
      address: company?.address || '',
      zipCode: company?.zipCode || '',
      city: company?.city || '',
      siret: company?.siret || '',
      ape: company?.ape || '',
      idcc: company?.idcc || '',
      idccLabel: company?.idccLabel || '',
    },
    employee: {
      code: e.employeeNumber || '',
      socialSecurityNumber: e.socialSecurityNumber || '',
      emploi: e.qualification || '',
      niveau: e.niveau || '',
      coefficient: e.coefficient || '',
      indice: e.indice || '',
      hireDate: e.hireDate ? new Date(e.hireDate).toLocaleDateString('fr-FR') : '',
      departureDate: e.departureDate ? new Date(e.departureDate).toLocaleDateString('fr-FR') : '',
      civility: e.gender === 'F' ? 'Mme' : 'M.',
      fullName: `${(e.firstname || '').toUpperCase()} ${(e.lastname || '').toUpperCase()}`.trim(),
      address: e.address || '',
      addressComplement: e.addressComplement || '',
      postalCode: e.postalCode || '',
      city: e.city || '',
    },
    periodStart: payslip.periodStart ? new Date(payslip.periodStart).toLocaleDateString('fr-FR') : '',
    periodEnd: payslip.periodEnd ? new Date(payslip.periodEnd).toLocaleDateString('fr-FR') : '',
    paymentDate: payslip.paymentDate ? new Date(payslip.paymentDate).toLocaleDateString('fr-FR') : '',
    paymentMethod: payslip.paymentMethod || 'Virement',
    sections: groupBySection(payslip.lines || []),
    totals: {
      brut: fmt(t.brut),
      cotisSal: fmt(t.cotisSal),
      cotisPat: fmt(t.cotisPat),
      netSocial: fmt(t.netSocial),
      netAvantImpot: fmt(t.netAvantImpot),
      netAPayer: fmt(t.netAPayer),
      totalVerseEmployeur: fmt(t.totalVerseEmployeur),
    },
    tax: {
      netImposable: fmt(payslip.tax?.netImposable),
      pasBase: fmt(payslip.tax?.pasBase),
      pasTaux: fmt(payslip.tax?.pasTaux),
      pasMontant: fmt(payslip.tax?.pasMontant),
      cumulAnnuel: fmt(payslip.tax?.cumulAnnuel),
    },
    cumuls: {
      period: mapCumuls(payslip.cumuls?.period),
      annual: mapCumuls(payslip.cumuls?.annual),
    },
  };
}

function groupBySection(lines) {
  const order = [];
  const map = {};
  for (const l of lines) {
    const sec = l.section || 'AUTRE';
    if (!map[sec]) { map[sec] = []; order.push(sec); }
    map[sec].push({
      libelle: l.libelle,
      base: l.base !== '' && l.base != null ? fmt(l.base) : '',
      taux: l.taux !== '' && l.taux != null ? fmt(l.taux) : '',
      montant: l.montant !== '' && l.montant != null ? fmt(l.montant) : '',
      chargesPatronales: l.chargesPatronales !== '' && l.chargesPatronales != null ? fmt(l.chargesPatronales) : '',
    });
  }
  return order.map((s) => ({ name: s, lines: map[s] }));
}

function mapCumuls(c = {}) {
  return {
    plafondSS: fmt(c.plafondSS),
    brut: fmt(c.brut),
    brutAbattu: fmt(c.brutAbattu),
    cotisSal: fmt(c.cotisSal),
    cotisPat: fmt(c.cotisPat),
    hresTrav: fmt(c.hresTrav),
    hresPay: fmt(c.hresPay),
    hresSupp: fmt(c.hresSupp),
  };
}

export default PayrollProfile;
