import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isPlainObject, omit, toInt, toStr } from '../common/utils/coerce';

/** Listes de référence et leurs valeurs par défaut (identiques à l'application d'origine). */
export const REFERENCE_KINDS = [
  'tax_rates',
  'hour_types',
  'payment_methods',
  'transport_modes',
  'qualifications',
  'motif_types',
  'justificatif_types',
  'access_methods',
  'security_measures',
] as const;

export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

const DEFAULTS: Record<ReferenceKind, Record<string, any>[]> = {
  tax_rates: [
    { id: 1, title: 'TVA NORMALE', value: 20.0 },
    { id: 2, title: 'TVA REDUIT', value: 5.5 },
  ],
  hour_types: [
    { id: 1, title: 'HEURE NORMALE', label: 'HEURE NORMALE', rate: 1 },
    { id: 2, title: 'HEURE SUP 1', label: 'HEURE SUP 1', rate: 1.25 },
    { id: 3, title: 'HEURE SUP 2', label: 'HEURE SUP 2', rate: 1.5 },
  ],
  payment_methods: [
    { id: 1, title: 'VIRA30JLDE05', label: 'VIREMENT 30 JOURS LE 5 DU MOIS', month: 0, day: 5 },
    { id: 2, title: 'VIRFINMOISDE15', label: 'VIREMENT FIN DE MOIS LE 15', month: 0, day: 15 },
    { id: 4, title: 'VIREMENT', label: 'VIREMENT', month: 1, day: 1 },
    { id: 5, title: 'CHEQUE', label: 'CHEQUE', month: 1, day: 1 },
  ],
  transport_modes: [
    { id: 1, title: 'TC', label: 'TRANSPORT EN COMMUN' },
    { id: 2, title: 'VOITURE', label: 'VOITURE' },
    { id: 3, title: 'PERSONNEL', label: 'PERSONNEL' },
    { id: 4, title: 'SELON MOYENS', label: 'SELON MOYENS' },
  ],
  qualifications: [
    { id: 11, title: 'CARRELEUR', label: 'MACON CARRELEUR' },
    { id: 12, title: "CHEF D'EQUIPE", label: "CHEF D'EQUIPE" },
    { id: 13, title: 'GROS ŒUVRES', label: 'GROS ŒUVRES' },
    { id: 14, title: 'GRUTIER', label: 'GRUTIER' },
    { id: 15, title: 'COFFREUR', label: 'COFFREUR' },
    { id: 16, title: 'FERAILLEUR', label: 'FERAILLEUR' },
    { id: 17, title: 'MACON', label: 'MACON' },
    { id: 18, title: 'MANŒUVRE', label: 'MANŒUVRE' },
    { id: 19, title: 'FACADIER BARDEUR', label: 'FACADIER BARDEUR' },
    { id: 20, title: 'CHAUFFEUR', label: 'CHAUFFEUR' },
  ],
  motif_types: [
    { id: 1, title: 'DELAIS', label: 'DELAIS DE CHANTIER A RESPECTER' },
    { id: 2, title: 'NOUVEAU', label: 'NOUVEAU CHANTIER' },
    { id: 3, title: 'RENFORT DE PERSONNEL', label: 'RENFORT DE PERSONNEL' },
  ],
  justificatif_types: [
    { id: 1, title: "ACCROISSEMENT TEMP. D'ACTIVITE", label: "ACCROISSEMENT TEMP. D'ACTIVITE" },
    { id: 2, title: 'REMPLACEMENT SALARIE ABSENT', label: 'REMPLACEMENT SALARIE ABSENT' },
    { id: 3, title: 'RENFORT DE PERSONNEL', label: 'RENFORT DE PERSONNEL' },
  ],
  access_methods: [
    { id: 1, title: 'BADGE', label: "BADGE D'ACCÈS" },
    { id: 2, title: 'CODE', label: "CODE D'ACCÈS" },
    { id: 3, title: 'ACCUEIL', label: "PRÉSENTATION À L'ACCUEIL" },
    { id: 4, title: 'CONTACT', label: 'CONTACTER RESPONSABLE SUR PLACE' },
  ],
  security_measures: [
    { id: 1, title: 'CASQUE', label: 'PORT DU CASQUE OBLIGATOIRE' },
    { id: 2, title: 'CHAUSSURES', label: 'CHAUSSURES DE SÉCURITÉ OBLIGATOIRES' },
    { id: 3, title: 'GANTS', label: 'PORT DES GANTS DE PROTECTION' },
    { id: 4, title: 'GILET', label: 'GILET HAUTE VISIBILITÉ' },
    { id: 5, title: 'HARNAIS', label: 'HARNAIS DE SÉCURITÉ OBLIGATOIRE' },
  ],
};

export const DEFAULT_COMPANY = {
  name: 'VOTRE ENTREPRISE',
  address: '123 Rue des Missions',
  zipCode: '75000',
  city: 'Paris',
  phone: '',
  email: '',
  siret: '',
  rcs: '',
  ape: '',
  logo: null,
};

function itemDoc(row: { id: number; data: unknown }) {
  const data = isPlainObject(row.data) ? row.data : {};
  return { ...data, id: row.id };
}

function signatureDoc(row: { id: number; title: string | null; type: string | null; imageData: string | null; data: unknown }) {
  const data = isPlainObject(row.data) ? row.data : {};
  return { ...data, id: row.id, title: row.title ?? data.title ?? '', type: row.type ?? data.type ?? 'signature', imageData: row.imageData };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  assertKind(kind: string): asserts kind is ReferenceKind {
    if (!(REFERENCE_KINDS as readonly string[]).includes(kind)) {
      throw new BadRequestException(`Liste de paramètres inconnue : ${kind}`);
    }
  }

  // ------------------------------------------------------------ Entreprise

  async getCompany() {
    const row = await this.prisma.companySettings.findUnique({ where: { id: 1 } });
    return row && isPlainObject(row.data) ? row.data : { ...DEFAULT_COMPANY };
  }

  async saveCompany(settings: unknown) {
    const data = isPlainObject(settings) ? settings : {};
    await this.prisma.companySettings.upsert({
      where: { id: 1 },
      update: { data: data as Prisma.InputJsonValue },
      create: { id: 1, data: data as Prisma.InputJsonValue },
    });
    return true;
  }

  // ------------------------------------------------------------ Listes de référence

  /** Liste d'une famille, initialisée avec les valeurs par défaut si elle est vide. */
  async getList(kind: ReferenceKind) {
    let rows = await this.prisma.referenceItem.findMany({ where: { kind }, orderBy: { id: 'asc' } });
    if (rows.length === 0 && DEFAULTS[kind].length > 0) {
      await this.prisma.referenceItem.createMany({
        data: DEFAULTS[kind].map((item) => ({
          kind,
          id: item.id,
          title: toStr(item.title),
          label: toStr(item.label),
          data: omit(item, ['id']) as Prisma.InputJsonValue,
        })),
        skipDuplicates: true,
      });
      rows = await this.prisma.referenceItem.findMany({ where: { kind }, orderBy: { id: 'asc' } });
    }
    return rows.map(itemDoc);
  }

  /** Création (id absent) ou mise à jour (id présent) d'un élément. */
  async saveItem(kind: ReferenceKind, item: unknown) {
    if (!isPlainObject(item)) throw new BadRequestException('Élément invalide');
    const id = toInt(item.id);
    const data = omit(item, ['id']);
    // Comme dans l'application d'origine, la liste est initialisée (valeurs par défaut) avant tout ajout.
    await this.getList(kind);
    return this.prisma.$transaction(async (tx) => {
      // Verrou applicatif par famille pour calculer max(id)+1 sans collision.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'reference_items:' + kind}))`;
      if (id !== null) {
        const existing = await tx.referenceItem.findUnique({ where: { kind_id: { kind, id } } });
        if (existing) {
          const row = await tx.referenceItem.update({
            where: { kind_id: { kind, id } },
            data: { title: toStr(data.title), label: toStr(data.label), data: data as Prisma.InputJsonValue },
          });
          return itemDoc(row);
        }
      }
      const max = await tx.referenceItem.aggregate({ where: { kind }, _max: { id: true } });
      const newId = id !== null ? id : (max._max.id ?? 0) + 1;
      const row = await tx.referenceItem.create({
        data: { kind, id: newId, title: toStr(data.title), label: toStr(data.label), data: data as Prisma.InputJsonValue },
      });
      return itemDoc(row);
    });
  }

  /** Remplacement complet d'une liste (import CSV / restauration). */
  async replaceList(kind: ReferenceKind, items: unknown, tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    if (!Array.isArray(items)) throw new BadRequestException('Liste invalide');
    await tx.referenceItem.deleteMany({ where: { kind } });
    let nextId = 1;
    const used = new Set<number>();
    for (const raw of items) {
      if (!isPlainObject(raw)) continue;
      let id = toInt(raw.id);
      if (id === null || used.has(id)) {
        while (used.has(nextId)) nextId++;
        id = nextId;
      }
      used.add(id);
      const data = omit(raw, ['id']);
      await tx.referenceItem.create({
        data: { kind, id, title: toStr(data.title), label: toStr(data.label), data: data as Prisma.InputJsonValue },
      });
    }
    return true;
  }

  async deleteItem(kind: ReferenceKind, id: number) {
    const existing = await this.prisma.referenceItem.findUnique({ where: { kind_id: { kind, id } } });
    if (!existing) throw new NotFoundException('Élément introuvable');
    await this.prisma.referenceItem.delete({ where: { kind_id: { kind, id } } });
    return true;
  }

  async getAllLists() {
    const out: Record<string, Record<string, any>[]> = {};
    for (const kind of REFERENCE_KINDS) out[kind] = await this.getList(kind);
    return out;
  }

  // ------------------------------------------------------------ Signatures et tampons

  async getSignatures() {
    const rows = await this.prisma.signature.findMany({ orderBy: { id: 'asc' } });
    return rows.map(signatureDoc);
  }

  async saveSignature(signature: unknown) {
    if (!isPlainObject(signature)) throw new BadRequestException('Signature invalide');
    const id = toInt(signature.id);
    const data = omit(signature, ['id', 'imageData']);
    const payload = {
      title: toStr(signature.title),
      type: toStr(signature.type) || 'signature',
      imageData: typeof signature.imageData === 'string' ? signature.imageData : null,
      data: data as Prisma.InputJsonValue,
    };
    if (id !== null) {
      const existing = await this.prisma.signature.findUnique({ where: { id } });
      if (existing) {
        return signatureDoc(await this.prisma.signature.update({ where: { id }, data: payload }));
      }
    }
    return signatureDoc(await this.prisma.signature.create({ data: payload }));
  }

  async deleteSignature(id: number) {
    const existing = await this.prisma.signature.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Signature introuvable');
    await this.prisma.signature.delete({ where: { id } });
    return true;
  }

  async insertSignatureWithId(tx: Prisma.TransactionClient, raw: Record<string, any>) {
    await tx.signature.create({
      data: {
        id: Number(raw.id),
        title: toStr(raw.title),
        type: toStr(raw.type) || 'signature',
        imageData: typeof raw.imageData === 'string' ? raw.imageData : null,
        data: omit(raw, ['id', 'imageData']) as Prisma.InputJsonValue,
      },
    });
  }
}
