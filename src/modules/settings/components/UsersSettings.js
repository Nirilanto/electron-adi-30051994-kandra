// src/modules/settings/components/UsersSettings.js
// Gestion des comptes utilisateurs (administrateurs uniquement).
import React, { useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import AuthService from '../../../services/AuthService';
import { useAuth } from '../../../contexts/AuthContext';

const EMPTY_FORM = { id: null, name: '', email: '', password: '', role: 'user', isActive: true };

function UsersSettings() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setUsers(await AuthService.listUsers());
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs :', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEdit = (user) => {
    setForm({ id: user.id, name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive });
  };

  const handleCancel = () => setForm(EMPTY_FORM);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nom et email sont obligatoires');
      return;
    }
    if (!form.id && form.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (form.id && form.password && form.password.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, isActive: form.isActive };
      if (form.password) payload.password = form.password;
      if (form.id) {
        await AuthService.updateUser(form.id, payload);
        toast.success('Utilisateur mis à jour');
      } else {
        await AuthService.createUser(payload);
        toast.success('Utilisateur créé');
      }
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer le compte de ${user.name} ?`)) return;
    try {
      await AuthService.deleteUser(user.id);
      toast.success('Utilisateur supprimé');
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('La confirmation ne correspond pas');
      return;
    }
    try {
      await AuthService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Mot de passe modifié');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Comptes utilisateurs</h2>

        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {form.id ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nom</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-input w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {form.id ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
              </label>
              <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" className="form-input w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rôle</label>
              <select name="role" value={form.role} onChange={handleChange} className="form-select w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div className="flex items-center">
              <input id="user-active" name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label htmlFor="user-active" className="ml-2 text-sm text-gray-700">Compte actif</label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            {form.id && (
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
                Annuler
              </button>
            )}
            <button type="submit" disabled={isSaving} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
              <PlusIcon className="h-4 w-4 mr-1" />
              {isSaving ? 'Enregistrement...' : form.id ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>

        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {user.name}
                      {currentUser && currentUser.id === user.id && <span className="ml-2 text-xs text-blue-600">(vous)</span>}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-sm space-x-2">
                      <button type="button" onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800" title="Modifier">
                        <PencilIcon className="h-4 w-4 inline" />
                      </button>
                      {currentUser && currentUser.id !== user.id && (
                        <button type="button" onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-800" title="Supprimer">
                          <TrashIcon className="h-4 w-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <KeyIcon className="h-5 w-5 mr-2 text-gray-500" />
          Changer mon mot de passe
        </h2>
        <form onSubmit={handlePasswordChange} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mot de passe actuel</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} autoComplete="current-password" className="form-input w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nouveau mot de passe</label>
            <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" className="form-input w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirmation</label>
            <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" className="form-input w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Modifier le mot de passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsersSettings;
