// src/modules/contracts/ContractService.js
import { v4 as uuidv4 } from "uuid";
import DatabaseService from "../../services/DatabaseService";
import SettingsService from "../settings/SettingsService";
import { formatDateToFrench, addMonths } from "../../utils/dateUtils";
import PDFGenerator from "./PDFGenerator";

class ContractService {
  constructor() {
    this.db = DatabaseService;
    this.contractsKey = "cm_contracts";
    this.settings = SettingsService;
    this.lastContractNumberKey = "cm_last_contract_number";
  }

  async getAllContracts() {
    try {
      // Récupérer tous les contrats
      const contracts = (await this.db.get(this.contractsKey)) || [];

      // Si aucun contrat n'est trouvé, retourner un tableau vide
      if (!contracts || contracts.length === 0) {
        return [];
      }

      // Pour chaque contrat, récupérer les données du client et de l'employé
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

            return enrichedContract;
          } catch (error) {
            console.error(
              `Erreur lors de l'enrichissement du contrat ${contract.id}:`,
              error
            );
            // Retourner le contrat original si une erreur se produit
            return contract;
          }
        })
      );

      console.log("Contrats enrichis:", enrichedContracts);
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

    if (contract.id) {
      // Mise à jour d'un contrat existant
      contracts = contracts.map((c) =>
        c.id === contract.id
          ? { ...contract, updatedAt: new Date().toISOString() }
          : c
      );
    } else {
      // Nouveau contrat
      const contractNumber = await this.getNextContractNumber();
      const newContract = {
        ...contract,
        id: uuidv4(),
        contractNumber: contractNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contracts.push(newContract);
    }

    await this.db.set(this.contractsKey, contracts);
    return contract.id ? contract : contracts[contracts.length - 1];
  }

  async deleteContract(id) {
    const contracts = await this.getAllContracts();
    const filteredContracts = contracts.filter((c) => c.id !== id);
    await this.db.set(this.contractsKey, filteredContracts);
    return true;
  }

  async generateEmployeeContractPDF(contractData) {
    try {
      // Obtenir les données complètes
      const contract = contractData;
      const employee =
        contract.employee ||
        (await this.db.getEmployeeById(contract.employeeId));
      const client =
        contract.client || (await this.db.getClientById(contract.clientId));

      // Utiliser le générateur PDF
      const result = await PDFGenerator.generateEmployeeContractPDF(
        contract,
        employee,
        client
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
    try {
      // Obtenir les données complètes
      const contract = contractData;
      const employee =
        contract.employee ||
        (await this.db.getEmployeeById(contract.employeeId));
      const client =
        contract.client || (await this.db.getClientById(contract.clientId));

      // Utiliser le générateur PDF
      const result = await PDFGenerator.generateClientContractPDF(
        contract,
        employee,
        client
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

  // Utilitaires
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
  // Modifications à apporter à ContractService.js
  // Ajoutez ces fonctions à votre fichier ContractService.js existant

  // Génération du PDF pour l'entreprise cliente
  async generateClientContractPDF(contract) {
    try {
      // Récupérer les informations de l'entreprise
      const companySettings = await this.settings.getCompanySettings();

      // Préparer les données pour le template
      const data = {
        // Informations sur le contrat
        reference: `N° ${contract.contractNumber}`,
        title: contract.title || "CONTRAT DE PRESTATION",
        description: contract.description || "",
        startDate: formatDateToFrench(new Date(contract.startDate)),
        endDate: formatDateToFrench(new Date(contract.endDate)),
        duration: this.calculateDuration(contract.startDate, contract.endDate),
        location: contract.location || "",

        // Tarifs et conditions financières
        hourlyRate: `${contract.billingRate || 0} €`,
        totalEstimation: `${this.calculateTotalEstimation(contract)} €`,
        paymentMethod: contract.paymentMethod || "Virement bancaire",
        paymentTerms: "30 jours fin de mois",

        // Informations sur le client
        client: {
          companyName: contract.client?.companyName || "",
          address: contract.client?.address || "",
          zipCode: contract.client?.zipCode || "",
          city: contract.client?.city || "",
          siret: contract.client?.siret || "",
          contactName: contract.client?.contactName || "",
          contactEmail: contract.client?.contactEmail || "",
          contactPhone: contract.client?.contactPhone || "",
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
        motif: contract.motif || "ACCROISSEMENT TEMP. D'ACTIVITE",
        justificatif: contract.justificatif || "RENFORT DE PERSONNEL",
      };

      // Générer le PDF
      const result = await window.electron.generatePDF(
        "client_contract", // Type de document
        data, // Données pour le template
        `Contrat_Client_${contract.contractNumber}.pdf` // Nom du fichier
      );

      return result;
    } catch (error) {
      console.error(
        "Erreur lors de la génération du contrat client PDF:",
        error
      );
      throw error;
    }
  }

  // Méthode pour calculer une estimation totale du contrat
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
  // pour l'employé à la fin de la mission
  async generateEmployeeCertificatePDF(contract) {
    try {
      // Récupérer les informations de l'entreprise
      const companySettings = await this.settings.getCompanySettings();

      // Préparer les données pour le template
      const data = {
        // Informations sur le contrat
        reference: `N° ${contract.contractNumber}`,
        title: "CERTIFICAT DE RÉALISATION DE MISSION",
        description: contract.description || "",
        startDate: formatDateToFrench(new Date(contract.startDate)),
        endDate: formatDateToFrench(new Date(contract.endDate)),
        duration: this.calculateDuration(contract.startDate, contract.endDate),
        location: contract.location || "",

        // Informations sur l'employé
        employee: {
          fullName: `${contract.employee?.firstName || ""} ${
            contract.employee?.lastName || ""
          }`.trim(),
          address: contract.employee?.address || "",
          email: contract.employee?.email || "",
          phone: contract.employee?.phone || "",
          skills: contract.employee?.skills || "",
        },

        // Informations sur le client
        client: {
          companyName: contract.client?.companyName || "",
          address: contract.client?.address || "",
          siret: contract.client?.siret || "",
          contactName: contract.client?.contactName || "",
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
        `Certificat_${contract.contractNumber}.pdf` // Nom du fichier
      );

      return result;
    } catch (error) {
      console.error("Erreur lors de la génération du certificat PDF:", error);
      throw error;
    }
  }
}

export default new ContractService();
