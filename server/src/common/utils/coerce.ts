/**
 * Fonctions de conversion tolérantes utilisées pour dériver les colonnes typées
 * depuis les documents JSON envoyés par le front (qui mélange chaînes vides,
 * nombres sous forme de texte, camelCase et snake_case).
 */

export function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

export function toFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

export function toStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value === '' ? null : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/** Date en texte ISO (ou telle quelle si déjà une chaîne). */
export function toDateStr(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

export function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  if (typeof value === 'number') return value !== 0;
  return false;
}

/** Première valeur définie parmi plusieurs clés d'un document (camelCase / snake_case). */
export function pick(doc: Record<string, any>, ...keys: string[]): unknown {
  for (const key of keys) {
    const v = doc?.[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/** Retire des clés d'un objet (sans le muter). */
export function omit<T extends Record<string, any>>(doc: T, keys: string[]): Record<string, any> {
  const copy: Record<string, any> = { ...doc };
  for (const key of keys) delete copy[key];
  return copy;
}

export function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
