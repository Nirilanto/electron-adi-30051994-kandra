/**
 * Reproduit la sémantique de l'ancien DatabaseService.getAll(entity, filters, order, direction) :
 * filtres d'égalité sur n'importe quel champ du document, puis tri en mémoire.
 * Les volumes d'une agence (quelques milliers de lignes) rendent l'approche suffisante
 * et évitent de divertir le comportement observé par le front.
 */

export interface ListQuery {
  filters: Record<string, string>;
  order?: string;
  direction: 'ASC' | 'DESC';
}

const RESERVED = new Set(['order', 'direction']);

/** Transforme la query string Express en filtres + tri. */
export function parseListQuery(query: Record<string, any> = {}): ListQuery {
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (RESERVED.has(key)) continue;
    if (value === undefined || value === null || value === '') continue;
    filters[key] = Array.isArray(value) ? String(value[0]) : String(value);
  }
  const direction = String(query.direction || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return { filters, order: query.order ? String(query.order) : undefined, direction };
}

/** Égalité tolérante : la query string ne transporte que des chaînes. */
export function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a === 'boolean' || typeof b === 'boolean') return String(a) === String(b);
  return String(a) === String(b);
}

export function applyFilters<T extends Record<string, any>>(items: T[], filters: Record<string, unknown>): T[] {
  const keys = Object.keys(filters || {});
  if (keys.length === 0) return items;
  return items.filter((item) => keys.every((key) => looseEquals(item[key], filters[key])));
}

function compareValues(a: unknown, b: unknown): number {
  const aMissing = a === undefined || a === null || a === '';
  const bMissing = b === undefined || b === null || b === '';
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1; // les valeurs vides en fin de liste
  if (bMissing) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const sa = String(a);
  const sb = String(b);
  const na = Number(sa);
  const nb = Number(sb);
  if (sa.trim() !== '' && sb.trim() !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return sa.localeCompare(sb, 'fr', { sensitivity: 'base' });
}

export function sortItems<T extends Record<string, any>>(
  items: T[],
  order: string | undefined,
  direction: 'ASC' | 'DESC' = 'ASC',
  fallbackKeys: string[] = [],
): T[] {
  const keys = order ? [order] : fallbackKeys;
  if (keys.length === 0) return items;
  const sign = direction === 'DESC' ? -1 : 1;
  return [...items].sort((a, b) => {
    for (const key of keys) {
      const c = compareValues(a[key], b[key]);
      if (c !== 0) return c * sign;
    }
    return 0;
  });
}
