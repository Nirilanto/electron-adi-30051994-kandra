/* eslint-disable no-console */
/**
 * Vide toutes les tables (développement / tests uniquement).
 *   npm run db:reset
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_RESET !== '1') {
    throw new Error('Refus : réinitialisation interdite en production (définir ALLOW_DB_RESET=1 pour forcer).');
  }
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE time_entries, invoices, payslips, contracts, employees, clients, reference_items, signatures, company_settings, counters, kv_store, users RESTART IDENTITY CASCADE',
    );
    console.log('Base réinitialisée.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
