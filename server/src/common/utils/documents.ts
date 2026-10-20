import { PrismaService } from '../../prisma/prisma.service';
import { isPlainObject, omit, toInt } from './coerce';

/** Clés de métadonnées gérées par la base, retirées du document avant stockage. */
export const META_KEYS = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'];

export function cleanDocument(doc: unknown): Record<string, any> {
  if (!isPlainObject(doc)) return {};
  return omit(doc, META_KEYS);
}

/** Document d'une entité à identifiant numérique (employés, clients, factures, bulletins). */
export function numericDoc(row: { id: number; data: unknown; createdAt: Date; updatedAt: Date }): Record<string, any> {
  const data: Record<string, any> = isPlainObject(row.data) ? row.data : {};
  return {
    ...data,
    id: row.id,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

/** Document d'une entité à identifiant uuid (contrats, pointages). */
export function uuidDoc(row: { id: string; data: unknown; createdAt: Date; updatedAt: Date }): Record<string, any> {
  const data: Record<string, any> = isPlainObject(row.data) ? row.data : {};
  return {
    ...data,
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Résout une clé étrangère optionnelle : renvoie l'identifiant s'il existe en base,
 * sinon null (le document garde sa valeur d'origine, seule la colonne relationnelle
 * est nulle, comme un lien rompu dans l'ancienne version).
 */
export async function resolveEmployeeId(prisma: PrismaService, value: unknown): Promise<number | null> {
  const id = toInt(value);
  if (id === null) return null;
  const found = await prisma.employee.findUnique({ where: { id }, select: { id: true } });
  return found ? id : null;
}

export async function resolveClientId(prisma: PrismaService, value: unknown): Promise<number | null> {
  const id = toInt(value);
  if (id === null) return null;
  const found = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  return found ? id : null;
}

export async function resolveContractId(prisma: PrismaService, value: unknown): Promise<string | null> {
  if (value === null || value === undefined || value === '') return null;
  const id = String(value);
  const found = await prisma.contract.findUnique({ where: { id }, select: { id: true } });
  return found ? id : null;
}

/** Remet la séquence d'une table à max(id) après un import avec identifiants explicites. */
export async function resyncSequence(prisma: PrismaService, table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
  );
}
