// src/modules/contracts/ContractService.js
import { v4 as uuidv4 } from "uuid";
import DatabaseService from "../../services/DatabaseService";
import SettingsService from "../settings/SettingsService";
import { formatDateToFrench, addMonths } from "../../utils/dateUtils";
import PDFGenerator from "./PDFGenerator";

class ContractService {
  constructor() {
    this.db = DatabaseService;
    this.contractsKey = "contracts";
    this.settings = SettingsService;
    this.lastContractNumberKey = "last_contract_number";
  }

  async getAllContracts() {
    try {
      // Récupérer tous les contrats (sans les signatures - juste les IDs)
      const contracts = (await this.db.get(this.contractsKey)) || [];

      if (!contracts || contracts.length === 0) {
        return [];
      }

      // Pour chaque contrat, récupérer les données du client et de l'employé
      // MAIS PAS les signatures (on garde juste les IDs)
      const enrichedContracts = await Promise.all(
        contracts.map(async (contract) => {
          try {
            let enrichedContract = { ...contract };

            // Si un client est référencé, récupérer ses informations
            if (contract.clientId) {
              const client = await this.db.getClientById(contract.clientId);
              if (client) {
                enrichedContract.client = client;
              }
            }

            // Si un employé est référencé, récupérer ses informations
            if (contract.employeeId) {
              const employee = await this.db.getEmployeeById(
                contract.employeeId
              );
              if (employee) {
                enrichedContract.employee = employee;
              }
            }

            // NE PAS récupérer les signatures ici - on garde juste les IDs
            // signatureId et stampId restent tels quels

            return enrichedContract;
          } catch (error) {
            console.error(
              `Erreur lors de l'enrichissement du contrat ${contract.id}:`,
              error
            );
            return contract;
          }
        })
      );

      console.log("Contrats enrichis (sans duplication signatures):", enrichedContracts);
      return enrichedContracts;
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats:", error);
      return [];
    }
  }

  async getContractById(id) {
    const contracts = await this.getAllContracts();
    return contracts.find((contract) => contract.id === id) || null;
  }

  async getNextContractNumber() {
    const lastNumber =
      (await this.db.get(this.lastContractNumberKey)) || 100000;
    const nextNumber = lastNumber + 1;
    await this.db.set(this.lastContractNumberKey, nextNumber);
    return nextNumber;
  }

  async saveContract(contract) {
    let contracts = await this.getAllContracts();

    // Nettoyer le contrat : ne garder que les IDs des signatures, pas les objets complets
    const cleanContract = {
      ...contract,
      // Garder seulement les IDs
      signatureId: contract.signatureId || "",
      stampId: contract.stampId || "",
      securityMeasures: contract.securityMeasures || []
    };

    if (cleanContract.id) {
      // Mise à jour d'un contrat existant
      contracts = contracts.map((c) =>
        c.id === cleanContract.id
          ? { ...cleanContract, updatedAt: new Date().toISOString() }
          : c
      );
    } else {
      // Nouveau contrat
      const contractNumber = await this.getNextContractNumber();
      const newContract = {
        ...cleanContract,
        id: uuidv4(),
        contractNumber: contractNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contracts.push(newContract);
    }

    await this.db.set(this.contractsKey, contracts);
    return cleanContract.id ? cleanContract : contracts[contracts.length - 1];
  }

  async deleteContract(id) {
    const contracts = await this.getAllContracts();
    const filteredContracts = contracts.filter((c) => c.id !== id);
    await this.db.set(this.contractsKey, filteredContracts);
    return true;
  }

  // Méthode helper pour récupérer les signatures complètes depuis les IDs
  async getContractWithSignatures(contractData) {
    const enrichedContract = { ...contractData };

    try {
      // Récupérer toutes les signatures disponibles
      const signatures = await this.settings.getSignatures();

      // Récupérer la signature si un ID est défini
      if (contractData.signatureId) {
        const signature = signatures.find(
          s => s.id === parseInt(contractData.signatureId)
        );
        if (signature) {
          enrichedContract.signature = signature;
        }
      }

      // Récupérer le tampon si un ID est défini
      if (contractData.stampId) {
        const stamp = signatures.find(
          s => s.id === parseInt(contractData.stampId)
        );
        if (stamp) {
          enrichedContract.stamp = stamp;
        }
      }

      // Récupérer les mesures de sécurité complètes
      if (contractData.securityMeasures && contractData.securityMeasures.length > 0) {
        const securityMeasures = await this.settings.getSecurityMeasures();
        enrichedContract.securityMeasuresList = contractData.securityMeasures
          .map((id) => {
            const measure = securityMeasures.find(
              (m) => m.id === parseInt(id)
            );
            return measure ? measure.label : null;
          })
          .filter(Boolean);
      } else {
        enrichedContract.securityMeasuresList = [];
      }

    } catch (error) {
      console.error("Erreur lors de la récupération des signatures:", error);
      enrichedContract.signature = null;
      enrichedContract.stamp = null;
      enrichedContract.securityMeasuresList = [];
    }

    return enrichedContract;
  }

  async generateEmployeeContractPDF(contractData) {
    try {
      // Enrichir le contrat avec les signatures complètes
      const enrichedContract = await this.getContractWithSignatures(contractData);
      
      // Obtenir les données complètes
      const companySettings = await this.settings.getCompanySettings();
      const employee =
        enrichedContract.employee ||
        (await this.db.getEmployeeById(enrichedContract.employeeId));
      const client =
        enrichedContract.client || 
        (await this.db.getClientById(enrichedContract.clientId));

      // Récupérer les données de signature et tampon (maintenant depuis les objets complets)
      const signature = enrichedContract.signature || null;
      const stamp = enrichedContract.stamp || null;
      const securityMeasures = enrichedContract.securityMeasuresList || [];

      // Utiliser le générateur PDF
      const result = await PDFGenerator.generateEmployeeContractPDF(
        enrichedContract,
        employee,
        client,
        {
          name: companySettings.name || "VOTRE ENTREPRISE",
          address: companySettings.address || "",
          zipCode: companySettings.zipCode || "",
          city: companySettings.city || "",
          siret: companySettings.siret || "",
          rcs: companySettings.rcs || "",
          ape: companySettings.ape || "",
          phone: companySettings.phone || "",
          email: companySettings.email || "",
          logo: companySettings.logo || null,
          signature: signature ? signature.imageData : null,
          stamp: stamp ? stamp.imageData : null,
          securityMeasures: securityMeasures,
        }
      );
      return { success: result.success };
    } catch (error) {
      console.error(
        "Erreur lors de la génération du PDF pour l'employé:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  async generateClientContractPDF(contractData) {
    console.log("Génération PDF client pour contrat:", contractData.id);

    try {
      // Enrichir le contrat avec les signatures complètes
      const enrichedContract = await this.getContractWithSignatures(contractData);
      
      const companySettings = await this.settings.getCompanySettings();

      // Obtenir les données complètes
      const employee =
        enrichedContract.employee ||
        (await this.db.getEmployeeById(enrichedContract.employeeId));
      const client =
        enrichedContract.client || 
        (await this.db.getClientById(enrichedContract.clientId));

      // Récupérer les mesures de sécurité et signatures (maintenant depuis les objets complets)
      const securityMeasures = enrichedContract.securityMeasuresList || [];
      const signature = enrichedContract.signature || null;
      const stamp = enrichedContract.stamp || null;

      // Utiliser le générateur PDF
      const result = await PDFGenerator.generateClientContractPDF(
        enrichedContract,
        employee,
        client,
        {
          name: companySettings.name || "VOTRE ENTREPRISE",
          address: companySettings.address || "",
          zipCode: companySettings.zipCode || "",
          city: companySettings.city || "",
          siret: companySettings.siret || "",
          rcs: companySettings.rcs || "",
          ape: companySettings.ape || "",
          phone: companySettings.phone || "",
          email: companySettings.email || "",
          logo: companySettings.logo || null,
          signature: signature ? signature.imageData : null,
          stamp: stamp ? stamp.imageData : null,
          securityMeasures: securityMeasures,
        }
      );
      return { success: result.success };
    } catch (error) {
      console.error(
        "Erreur lors de la génération du PDF pour le client:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  generateEmployeeCertificatePDF(contract) {
    // Code pour générer un certificat d'accomplissement pour l'employé
  }

  // Utilitaires (inchangés)
  calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return "";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculer les mois et jours
    let months = 0;
    let days = diffDays;

    // Si plus de 30 jours, convertir en mois + jours
    if (days > 30) {
      let tempDate = new Date(start);
      while (true) {
        const nextMonth = addMonths(tempDate, 1);
        if (nextMonth > end) break;
        months++;
        tempDate = nextMonth;
      }

      // Calculer les jours restants
      const remainingDays = Math.ceil((end - tempDate) / (1000 * 60 * 60 * 24));
      days = remainingDays;
    }

    // Formater la durée
    let duration = "";
    if (months > 0) {
      duration += `${months} mois`;
      if (days > 0) duration += ` et ${days} jours`;
    } else {
      duration = `${days} jours`;
    }

    return duration;
  }

  // Méthode pour calculer une estimation totale du contrat (inchangée)
  calculateTotalEstimation(contract) {
    if (!contract.startDate || !contract.endDate || !contract.billingRate) {
      return 0;
    }

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);

    // Calculer le nombre de jours ouvrés entre les deux dates
    let workingDays = 0;
    let current = new Date(start);

    while (current <= end) {
      // Compter comme jour ouvré si ce n'est pas un samedi (6) ou un dimanche (0)
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }

      // Passer au jour suivant
      current.setDate(current.getDate() + 1);
    }

    // Estimation basée sur 7 heures par jour et le taux horaire
    const hoursPerDay = 7;
    const totalHours = workingDays * hoursPerDay;
    const totalEstimation = totalHours * contract.billingRate;

    return Math.round(totalEstimation * 100) / 100; // Arrondir à 2 décimales
  }

  // Vous pouvez ajouter cette fonction pour générer un certificat d'accomplissement
  // pour l'employé à la fin de la mission (inchangée)
  async generateEmployeeCertificatePDF(contract) {
    try {
      // Enrichir le contrat avec les signatures complètes
      const enrichedContract = await this.getContractWithSignatures(contract);
      
      // Récupérer les informations de l'entreprise
      const companySettings = await this.settings.getCompanySettings();

      // Préparer les données pour le template
      const data = {
        // Informations sur le contrat
        reference: `N° ${enrichedContract.contractNumber}`,
        title: "CERTIFICAT DE RÉALISATION DE MISSION",
        description: enrichedContract.description || "",
        startDate: formatDateToFrench(new Date(enrichedContract.startDate)),
        endDate: formatDateToFrench(new Date(enrichedContract.endDate)),
        duration: this.calculateDuration(enrichedContract.startDate, enrichedContract.endDate),
        location: enrichedContract.location || "",

        // Informations sur l'employé
        employee: {
          fullName: `${enrichedContract.employee?.firstName || ""} ${
            enrichedContract.employee?.lastName || ""
          }`.trim(),
          address: enrichedContract.employee?.address || "",
          email: enrichedContract.employee?.email || "",
          phone: enrichedContract.employee?.phone || "",
          skills: enrichedContract.employee?.skills || "",
        },

        // Informations sur le client
        client: {
          companyName: enrichedContract.client?.companyName || "",
          address: enrichedContract.client?.address || "",
          siret: enrichedContract.client?.siret || "",
          contactName: enrichedContract.client?.contactName || "",
        },

        // Informations sur la société
        company: {
          name: companySettings.name || "VOTRE ENTREPRISE",
          address: companySettings.address || "",
          zipCode: companySettings.zipCode || "",
          city: companySettings.city || "",
          siret: companySettings.siret || "",
          rcs: companySettings.rcs || "",
          ape: companySettings.ape || "",
          phone: companySettings.phone || "",
          email: companySettings.email || "",
          logo: companySettings.logo || null,
        },

        // Autres informations
        generationDate: formatDateToFrench(new Date()),
        year: new Date().getFullYear(),
      };

      // Générer le PDF
      const result = await window.electron.generatePDF(
        "certificate", // Type de document
        data, // Données pour le template
        `Certificat_${enrichedContract.contractNumber}.pdf` // Nom du fichier
      );

      return result;
    } catch (error) {
      console.error("Erreur lors de la génération du certificat PDF:", error);
      throw error;
    }
  }
}

export default new ContractService();