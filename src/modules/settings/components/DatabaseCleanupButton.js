// Ajouter ce bouton dans SignaturesSettings.js ou dans un composant de maintenance

import React, { useState } from 'react';
import { TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DatabaseService from '../../../services/DatabaseService';

function DatabaseCleanupButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Fonction pour nettoyer la base de données
    const cleanupDatabase = async () => {
        setIsLoading(true);
        setCleanupResult(null);

        try {
            // Le nettoyage est réalisé côté serveur (suppression des images dupliquées dans les contrats)
            const result = await DatabaseService.cleanupContracts();
            console.log(`✅ ${result.contractsUpdated} contrats nettoyés`);
            setCleanupResult(result);

        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
            setCleanupResult({
                success: false,
                error: error.message
            });
        } finally {
            setIsLoading(false);
            setShowConfirmation(false);
        }
    };

    const handleCleanupClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmCleanup = () => {
        cleanupDatabase();
    };

    const handleCancelCleanup = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            {/* Bouton de nettoyage */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start justify-between">
                    <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-medium text-yellow-800 mb-1">
                                Optimisation de la base de données
                            </h3>
                            <p className="text-sm text-yellow-700 mb-3">
                                Les anciens contrats contiennent des images base64 dupliquées.
                                Cliquez pour supprimer ces doublons et libérer de l'espace de stockage.
                            </p>

                            {cleanupResult && (
                                <div className={`p-3 rounded-md mb-3 ${cleanupResult.success
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-red-50 border border-red-200'
                                    }`}>
                                    {cleanupResult.success ? (
                                        <div className="flex items-start">
                                            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                                            <div className="text-sm text-green-800">
                                                <p className="font-medium mb-1">✅ Nettoyage terminé avec succès !</p>
                                                <ul className="space-y-1 text-xs">
                                                    <li>• {cleanupResult.contractsTotal} contrats analysés</li>
                                                    <li>• {cleanupResult.contractsUpdated} contrats nettoyés</li>
                                                    <li>• <strong>{cleanupResult.spaceSavedKB} KB</strong> d'espace libéré
                                                        {cleanupResult.spaceSavedMB > 0 && ` (${cleanupResult.spaceSavedMB} MB)`}
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-red-800">
                                            <p className="font-medium">❌ Erreur lors du nettoyage</p>
                                            <p className="text-xs mt-1">{cleanupResult.error}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCleanupClick}
                        disabled={isLoading}
                        className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${isLoading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Nettoyage...
                            </>
                        ) : (
                            <>
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Nettoyer la DB
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Modal de confirmation */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-start mb-4">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Nettoyer la base de données
                                </h3>

                                <div className="text-sm text-gray-600 space-y-2 mb-4">
                                    <p>Cette action va :</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs bg-gray-50 p-3 rounded">
                                        <li>Supprimer tous les <code>imageData</code> des objets <code>signature</code> et <code>stamp</code> dans les contrats</li>
                                        <li>Conserver les <code>signatureId</code> et <code>stampId</code> pour les références</li>
                                        <li>Libérer de l'espace de stockage (potentiellement plusieurs MB)</li>
                                        <li>Améliorer les performances de chargement</li>
                                    </ul>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-3">
                                        <p className="text-xs text-yellow-800">
                                            ⚠️ <strong>Sauvegarde recommandée :</strong> Bien que cette action soit sûre,
                                            il est recommandé de faire une sauvegarde avant de continuer.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancelCleanup}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCleanup}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Lancer le nettoyage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DatabaseCleanupButton;

// Pour l'intégrer dans SignaturesSettings.js, ajoutez ceci dans le render :
/*
// Dans SignaturesSettings.js, ajoutez cet import en haut :
import DatabaseCleanupButton from './DatabaseCleanupButton';

// Et ajoutez le composant juste après l'information sur l'optimisation :
{/ * Information sur l'optimisation * /}
<div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
  {/ * ... contenu existant ... * /}
</div>

{/ * Bouton de nettoyage de la base de données * /}
<DatabaseCleanupButton />
*/