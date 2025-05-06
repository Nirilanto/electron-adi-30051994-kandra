// src/modules/settings/Settings.js
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SettingsService from './SettingsService';
import CompanySettings from './components/CompanySettings';
import TaxRatesSettings from './components/TaxRatesSettings';
import HourTypesSettings from './components/HourTypesSettings';
import PaymentMethodsSettings from './components/PaymentMethodsSettings';
import TransportModesSettings from './components/TransportModesSettings';
import QualificationsSettings from './components/QualificationsSettings';
import MotifTypesSettings from './components/MotifTypesSettings';
import JustificatifTypesSettings from './components/JustificatifTypesSettings';

// Importer les composants Tab personnalisés au lieu de @headlessui/react
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '../../components/common/Tabs';

function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState(null);
  const [taxRates, setTaxRates] = useState([]);
  const [hourTypes, setHourTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transportModes, setTransportModes] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [motifTypes, setMotifTypes] = useState([]);
  const [justificatifTypes, setJustificatifTypes] = useState([]);

  // Chargement initial des données
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const company = await SettingsService.getCompanySettings();
        setCompanySettings(company);
        
        const taxes = await SettingsService.getTaxRates();
        setTaxRates(taxes);
        
        const hours = await SettingsService.getHourTypes();
        setHourTypes(hours);
        
        const payments = await SettingsService.getPaymentMethods();
        setPaymentMethods(payments);
        
        const transport = await SettingsService.getTransportModes();
        setTransportModes(transport);
        
        const quals = await SettingsService.getQualifications();
        setQualifications(quals);
        
        const motifs = await SettingsService.getMotifTypes();
        setMotifTypes(motifs);
        
        const justificatifs = await SettingsService.getJustificatifTypes();
        setJustificatifTypes(justificatifs);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres :', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Gestionnaires pour enregistrer les modifications
  const handleSaveCompanySettings = async (settings) => {
    try {
      await SettingsService.saveCompanySettings(settings);
      setCompanySettings(settings);
      toast.success('Paramètres de l\'entreprise enregistrés');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des paramètres de l\'entreprise :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleSaveTaxRate = async (taxRate) => {
    try {
      await SettingsService.saveTaxRate(taxRate);
      const updated = await SettingsService.getTaxRates();
      setTaxRates(updated);
      toast.success('Taux de TVA enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du taux de TVA :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteTaxRate = async (id) => {
    try {
      await SettingsService.deleteTaxRate(id);
      const updated = await SettingsService.getTaxRates();
      setTaxRates(updated);
      toast.success('Taux de TVA supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du taux de TVA :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveHourType = async (hourType) => {
    try {
      await SettingsService.saveHourType(hourType);
      const updated = await SettingsService.getHourTypes();
      setHourTypes(updated);
      toast.success('Type d\'heure enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du type d\'heure :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteHourType = async (id) => {
    try {
      await SettingsService.deleteHourType(id);
      const updated = await SettingsService.getHourTypes();
      setHourTypes(updated);
      toast.success('Type d\'heure supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du type d\'heure :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSavePaymentMethod = async (method) => {
    try {
      await SettingsService.savePaymentMethod(method);
      const updated = await SettingsService.getPaymentMethods();
      setPaymentMethods(updated);
      toast.success('Mode de paiement enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mode de paiement :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      await SettingsService.deletePaymentMethod(id);
      const updated = await SettingsService.getPaymentMethods();
      setPaymentMethods(updated);
      toast.success('Mode de paiement supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du mode de paiement :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveTransportMode = async (mode) => {
    try {
      await SettingsService.saveTransportMode(mode);
      const updated = await SettingsService.getTransportModes();
      setTransportModes(updated);
      toast.success('Moyen de transport enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du moyen de transport :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteTransportMode = async (id) => {
    try {
      await SettingsService.deleteTransportMode(id);
      const updated = await SettingsService.getTransportModes();
      setTransportModes(updated);
      toast.success('Moyen de transport supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du moyen de transport :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveQualification = async (qualification) => {
    try {
      await SettingsService.saveQualification(qualification);
      const updated = await SettingsService.getQualifications();
      setQualifications(updated);
      toast.success('Qualification enregistrée');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la qualification :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteQualification = async (id) => {
    try {
      await SettingsService.deleteQualification(id);
      const updated = await SettingsService.getQualifications();
      setQualifications(updated);
      toast.success('Qualification supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la qualification :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveMotifType = async (motif) => {
    try {
      await SettingsService.saveMotifType(motif);
      const updated = await SettingsService.getMotifTypes();
      setMotifTypes(updated);
      toast.success('Motif enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du motif :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteMotifType = async (id) => {
    try {
      await SettingsService.deleteMotifType(id);
      const updated = await SettingsService.getMotifTypes();
      setMotifTypes(updated);
      toast.success('Motif supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du motif :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveJustificatifType = async (justificatif) => {
    try {
      await SettingsService.saveJustificatifType(justificatif);
      const updated = await SettingsService.getJustificatifTypes();
      setJustificatifTypes(updated);
      toast.success('Justificatif enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du justificatif :', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteJustificatifType = async (id) => {
    try {
      await SettingsService.deleteJustificatifType(id);
      const updated = await SettingsService.getJustificatifTypes();
      setJustificatifTypes(updated);
      toast.success('Justificatif supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du justificatif :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>
      
      <div className="mb-6">
        <TabGroup defaultIndex={0}>
          <TabList>
            <Tab>Entreprise</Tab>
            <Tab>TVA</Tab>
            <Tab>Heures</Tab>
            <Tab>Paiements</Tab>
            <Tab>Transport</Tab>
            <Tab>Qualifications</Tab>
            <Tab>Motifs</Tab>
            <Tab>Justificatifs</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <CompanySettings 
                settings={companySettings} 
                onSave={handleSaveCompanySettings} 
              />
            </TabPanel>
            <TabPanel>
              <TaxRatesSettings 
                taxRates={taxRates} 
                onSave={handleSaveTaxRate} 
                onDelete={handleDeleteTaxRate} 
              />
            </TabPanel>
            <TabPanel>
              <HourTypesSettings 
                hourTypes={hourTypes} 
                onSave={handleSaveHourType} 
                onDelete={handleDeleteHourType} 
              />
            </TabPanel>
            <TabPanel>
              <PaymentMethodsSettings 
                paymentMethods={paymentMethods} 
                onSave={handleSavePaymentMethod} 
                onDelete={handleDeletePaymentMethod} 
              />
            </TabPanel>
            <TabPanel>
              <TransportModesSettings 
                transportModes={transportModes} 
                onSave={handleSaveTransportMode} 
                onDelete={handleDeleteTransportMode} 
              />
            </TabPanel>
            <TabPanel>
              <QualificationsSettings 
                qualifications={qualifications} 
                onSave={handleSaveQualification} 
                onDelete={handleDeleteQualification} 
              />
            </TabPanel>
            <TabPanel>
              <MotifTypesSettings 
                motifTypes={motifTypes} 
                onSave={handleSaveMotifType} 
                onDelete={handleDeleteMotifType} 
              />
            </TabPanel>
            <TabPanel>
              <JustificatifTypesSettings 
                justificatifTypes={justificatifTypes} 
                onSave={handleSaveJustificatifType} 
                onDelete={handleDeleteJustificatifType} 
              />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default Settings;