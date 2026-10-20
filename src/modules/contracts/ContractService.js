// src/modules/contracts/ContractService.js
import DatabaseService from "../../services/DatabaseService";
import SettingsService from "../settings/SettingsService";
import PdfClient from "../../services/PdfClient";
import { formatDateToFrench, addMonths } from "../../utils/dateUtils";
import PDFGenerator from "./PDFGenerator";

class ContractService {
  constructor() {
    this.db = DatabaseService;
    this.contractsKey = "contracts";
    this.settings = SettingsService;
    this.lastContractNumberKey = "last_contract_number";
  }

  /**
   * Tous les contrats, enrichis par le serveur avec les objets `client` et `employee`
   * (les signatures ne sont jamais dupliquées : seuls signatureId / stampId sont stockés).
   */
  async getAllContracts() {
    try {
      const contracts = await this.db.getContracts();
      return Array.isArray(contracts) ? contracts : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats:", error);
      return [];
    }
  }

  async getContractById(id) {
    if (!id) return null;
    try {
      return await this.db.getContractById(id);
    } catch (error) {
      if (error.status === 404) return null;
      console.error(`Erreur lors de la récupération du contrat ${id}:`, error);
      throw error;
    }
  }

  /** Numéro de contrat attribué par le serveur (compteur atomique, multi-utilisateurs). */
  async getNextContractNumber() {
    return this.db.getNextContractNumber();
  }

  /**
   * Création ou remplacement complet d'un contrat.
   * Le serveur nettoie les objets enrichis et attribue le numéro à la création.
   */
  async saveContract(contract) {
    const cleanContract = {
      ...contract,
      signatureId: contract.signatureId || "",
      stampId: contract.stampId || "",
      securityMeasures: contract.securityMeasures || [],
    };

    if (cleanContract.id) {
      return this.db.replaceContract(cleanContract.id, cleanContract);
    }

    const { id, createdAt, updatedAt, ...toCreate } = cleanContract;
    return this.db.createContract(toCreate);
  }

  async deleteContract(id) {
    await this.db.deleteContract(id);
    return true;
  }

  // Méthode helper pour récupérer les signatures complètes depuis les IDs
  async getContractWithSignatures(contractData) {
    const enrichedContract = { ...contractData };

    try {
      const signatures = await this.settings.getSignatures();

      if (contractData.signatureId) {
        const signature = signatures.find(
          (s) => s.id === parseInt(contractData.signatureId)
        );
        if (signature) {
          enrichedContract.signature = signature;
        }
      }

      if (contractData.stampId) {
        const stamp = signatures.find(
          (s) => s.id === parseInt(contractData.stampId)
        );
        if (stamp) {
          enrichedContract.stamp = stamp;
        }
      }

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

  async buildCompanyData(enrichedContract) {
    const companySettings = await this.settings.getCompanySettings();
    const signature = enrichedContract.signature || null;
    const stamp = enrichedContract.stamp || null;
    return {
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
      securityMeasures: enrichedContract.securityMeasuresList || [],
    };
  }

  async generateEmployeeContractPDF(contractData) {
    try {
      const enrichedContract = await this.getContractWithSignatures(contractData);
      const employee =
        enrichedContract.employee ||
        (await this.db.getEmployeeById(enrichedContract.employeeId));
      const client =
        enrichedContract.client ||
        (await this.db.getClientById(enrichedContract.clientId));

      const result = await PDFGenerator.generateEmployeeContractPDF(
        enrichedContract,
        employee,
        client,
        await this.buildCompanyData(enrichedContract)
      );
      return { success: result.success, error: result.error };
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
      const enrichedContract = await this.getContractWithSignatures(contractData);
      const employee =
        enrichedContract.employee ||
        (await this.db.getEmployeeById(enrichedContract.employeeId));
      const client =
        enrichedContract.client ||
        (await this.db.getClientById(enrichedContract.clientId));

      const result = await PDFGenerator.generateClientContractPDF(
        enrichedContract,
        employee,
        client,
        await this.buildCompanyData(enrichedContract)
      );
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error(
        "Erreur lors de la génération du PDF pour le client:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Utilitaires (inchangés)
  calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return "";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let months = 0;
    let days = diffDays;

    if (days > 30) {
      let tempDate = new Date(start);
      while (true) {
        const nextMonth = addMonths(tempDate, 1);
        if (nextMonth > end) break;
        months++;
        tempDate = nextMonth;
      }

      const remainingDays = Math.ceil((end - tempDate) / (1000 * 60 * 60 * 24));
      days = remainingDays;
    }

    let duration = "";
    if (months > 0) {
      duration += `${months} mois`;
      if (days > 0) duration += ` et ${days} jours`;
    } else {
      duration = `${days} jours`;
    }

    return duration;
  }

  // Estimation totale du contrat (inchangée)
  calculateTotalEstimation(contract) {
    if (!contract.startDate || !contract.endDate || !contract.billingRate) {
      return 0;
    }

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);

    let workingDays = 0;
    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    const hoursPerDay = 7;
    const totalHours = workingDays * hoursPerDay;
    const totalEstimation = totalHours * contract.billingRate;

    return Math.round(totalEstimation * 100) / 100;
  }

  // Certificat de réalisation de mission (inchangé, PDF généré par le serveur)
  async generateEmployeeCertificatePDF(contract) {
    try {
      const enrichedContract = await this.getContractWithSignatures(contract);
      const companySettings = await this.settings.getCompanySettings();

      const data = {
        reference: `N° ${enrichedContract.contractNumber}`,
        title: "CERTIFICAT DE RÉALISATION DE MISSION",
        description: enrichedContract.description || "",
        startDate: formatDateToFrench(new Date(enrichedContract.startDate)),
        endDate: formatDateToFrench(new Date(enrichedContract.endDate)),
        duration: this.calculateDuration(enrichedContract.startDate, enrichedContract.endDate),
        location: enrichedContract.location || "",

        employee: {
          fullName: `${enrichedContract.employee?.firstName || ""} ${
            enrichedContract.employee?.lastName || ""
          }`.trim(),
          address: enrichedContract.employee?.address || "",
          email: enrichedContract.employee?.email || "",
          phone: enrichedContract.employee?.phone || "",
          skills: enrichedContract.employee?.skills || "",
        },

        client: {
          companyName: enrichedContract.client?.companyName || "",
          address: enrichedContract.client?.address || "",
          siret: enrichedContract.client?.siret || "",
          contactName: enrichedContract.client?.contactName || "",
        },

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

        generationDate: formatDateToFrench(new Date()),
        year: new Date().getFullYear(),
      };

      return await PdfClient.generatePDF(
        "certificate",
        data,
        `Certificat_${enrichedContract.contractNumber}.pdf`
      );
    } catch (error) {
      console.error("Erreur lors de la génération du certificat PDF:", error);
      throw error;
    }
  }
}

export default new ContractService();
