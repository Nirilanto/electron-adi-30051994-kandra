// src/components/LoginPage.jsx
// Connexion des utilisateurs et création du premier administrateur.
import React, { useState } from 'react';
import { KeyIcon, ShieldCheckIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import AuthService from '../services/AuthService';

const LoginPage = ({ needsSetup, onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez saisir votre email et votre mot de passe');
      return;
    }
    if (needsSetup && !name.trim()) {
      setError('Veuillez saisir votre nom');
      return;
    }

    setIsLoading(true);
    try {
      const user = needsSetup
        ? await AuthService.setup(email.trim(), password, name.trim())
        : await AuthService.login(email.trim(), password);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contrat Manager</h1>
          <p className="text-gray-600 mt-2">
            {needsSetup
              ? "Bienvenue ! Créez le compte administrateur pour démarrer l'application."
              : 'Connectez-vous pour accéder à votre espace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsSetup && (
            <div>
              <label htmlFor="login-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre nom"
                  autoComplete="name"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="vous@entreprise.fr"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={needsSetup ? '8 caractères minimum' : '••••••••'}
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Veuillez patienter...' : needsSetup ? 'Créer le compte administrateur' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {needsSetup
              ? 'Vous pourrez ensuite créer les comptes des autres utilisateurs dans les paramètres.'
              : "Mot de passe oublié ? Demandez à un administrateur de le réinitialiser."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
