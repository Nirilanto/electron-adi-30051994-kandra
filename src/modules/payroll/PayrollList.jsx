// src/modules/payroll/PayrollList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, DocumentTextIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import PayrollService from './PayrollService';

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR');
};

const formatMoney = (n) => {
  const v = parseFloat(n) || 0;
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PayrollList = () => {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const items = await PayrollService.getAll();
      setPayslips(items);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors du chargement des bulletins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bulletin ?')) return;
    try {
      await PayrollService.delete(id);
      toast.success('Bulletin supprimé');
      load();
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bulletins de paie</h1>
        <Link
          to="/payroll/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau bulletin
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement…</div>
      ) : payslips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">Aucun bulletin pour le moment.</p>
          <Link to="/payroll/new" className="mt-4 inline-block text-blue-600 hover:underline">
            Créer le premier
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salarié</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net à payer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payslips.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {p.employeeFirstname || ''} {p.employeeLastname || ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(p.periodStart)} → {formatDate(p.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatMoney(p.totals?.netAPayer)} €
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => navigate(`/payroll/${p.id}`)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="Voir"
                    >
                      <EyeIcon className="inline h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <TrashIcon className="inline h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PayrollList;
