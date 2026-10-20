/* eslint-disable no-console */
/**
 * Test de fumée de l'API : parcourt les fonctionnalités principales sur une base
 * vide et vérifie que le contrat de données attendu par le front est respecté.
 *
 *   API_URL=http://localhost:3001/api npm run smoke
 */
const API = process.env.API_URL || 'http://localhost:3001/api';
let token = null;
let failures = 0;

async function call(method, path, body, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const type = res.headers.get('content-type') || '';
  const payload = type.includes('application/json') ? await res.json() : type.includes('pdf') ? await res.arrayBuffer() : await res.text();
  if (!res.ok && !opts.allowError) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(payload).slice(0, 300)}`);
  }
  return { status: res.status, payload };
}

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ' -> ' + detail : ''}`);
  }
}

async function main() {
  console.log(`API : ${API}`);
  const health = await call('GET', '/health');
  check('health', health.payload.status === 'ok', JSON.stringify(health.payload));

  // --- Authentification
  const status = await call('GET', '/auth/status');
  const email = `admin+${Date.now()}@example.com`;
  if (status.payload.needsSetup) {
    const setup = await call('POST', '/auth/setup', { email, password: 'motdepasse123', name: 'Admin' });
    token = setup.payload.token;
    check('setup premier admin', !!token && setup.payload.user.role === 'admin');
  } else {
    const login = await call('POST', '/auth/login', { email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD });
    token = login.payload.token;
    check('login', !!token);
  }
  const me = await call('GET', '/auth/me');
  check('auth/me', me.payload.email, JSON.stringify(me.payload));
  const unauth = await fetch(API + '/employees');
  check('401 sans jeton', unauth.status === 401, String(unauth.status));

  // --- Utilisateurs
  const user = await call('POST', '/users', { email: `user+${Date.now()}@example.com`, password: 'motdepasse123', name: 'Utilisateur', role: 'user' });
  check('création utilisateur', user.payload.id > 0 && user.payload.role === 'user');

  // --- Paramètres (valeurs par défaut)
  const quals = await call('GET', '/settings/lists/qualifications');
  check('qualifications par défaut (ids 11..20)', quals.payload.length === 10 && quals.payload[0].id === 11, JSON.stringify(quals.payload.map((q) => q.id)));
  const pm = await call('GET', '/settings/lists/payment_methods');
  check('modes de paiement par défaut (1,2,4,5)', JSON.stringify(pm.payload.map((p) => p.id)) === '[1,2,4,5]', JSON.stringify(pm.payload.map((p) => p.id)));
  const newTax = await call('POST', '/settings/lists/tax_rates', { title: 'TVA TEST', value: 10 });
  check('nouveau taux TVA id = max+1', newTax.payload.id === 3, JSON.stringify(newTax.payload));
  const updTax = await call('POST', '/settings/lists/tax_rates', { id: 3, title: 'TVA TEST 2', value: 11 });
  check('mise à jour taux TVA', updTax.payload.title === 'TVA TEST 2' && updTax.payload.value === 11);
  await call('DELETE', '/settings/lists/tax_rates/3');
  const taxes = await call('GET', '/settings/lists/tax_rates');
  check('suppression taux TVA', taxes.payload.length === 2);
  const company = await call('GET', '/settings/company');
  check('paramètres entreprise par défaut', company.payload.name === 'VOTRE ENTREPRISE');
  await call('PUT', '/settings/company', { ...company.payload, name: 'ATLANTIS TEST', logo: null });
  const company2 = await call('GET', '/settings/company');
  check('sauvegarde entreprise', company2.payload.name === 'ATLANTIS TEST');
  const sig = await call('POST', '/settings/signatures', { title: 'Signature test', type: 'signature', imageData: 'data:image/png;base64,iVBORw0KGgo=' });
  check('signature créée', sig.payload.id === 1 && sig.payload.imageData.startsWith('data:image'));

  // --- Employés
  const emp = await call('POST', '/employees', {
    firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com', hourlyRate: '12.5', status: 'active',
    birthDate: null, qualification: 'MACON', nationality: 'FRANCAISE',
  });
  check('création employé (id numérique + created_at)', emp.payload.id === 1 && typeof emp.payload.created_at === 'string' && emp.payload.hourlyRate === '12.5', JSON.stringify(emp.payload));
  const emp2 = await call('POST', '/employees', { firstName: 'Anna', lastName: 'Bernard', status: 'inactive' });
  const emps = await call('GET', '/employees');
  check('liste employés triée par nom', emps.payload.map((e) => e.lastName).join(',') === 'Bernard,Dupont', emps.payload.map((e) => e.lastName).join(','));
  const active = await call('GET', '/employees?status=active');
  check('filtre status=active', active.payload.length === 1 && active.payload[0].id === emp.payload.id);
  const empUpd = await call('PATCH', `/employees/${emp.payload.id}`, { phone: '0600000000' });
  check('mise à jour employé par fusion', empUpd.payload.phone === '0600000000' && empUpd.payload.firstName === 'Jean');
  const notFound = await call('GET', '/employees/9999', undefined, { allowError: true });
  check('employé inconnu -> 404', notFound.status === 404);

  // --- Clients
  const cli = await call('POST', '/clients', { companyName: 'BTP SARL', contactName: 'Marc', siret: '12345678901234', status: 'active' });
  check('création client', cli.payload.id === 1 && cli.payload.companyName === 'BTP SARL');

  // --- Contrats
  const contractBody = {
    title: 'Mission test', employeeId: String(emp.payload.id), clientId: String(cli.payload.id),
    startDate: new Date().toISOString(), endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    hourlyRate: 12, billingRate: 25, securityMeasures: [1, 2], signatureId: '1', stampId: '',
    employee: { fake: true }, client: { fake: true },
  };
  const contract = await call('POST', '/contracts', contractBody);
  check('contrat : uuid + numéro 100001', typeof contract.payload.id === 'string' && contract.payload.contractNumber === 100001, JSON.stringify({ id: contract.payload.id, n: contract.payload.contractNumber }));
  check('contrat enrichi employé/client (objets réels)', contract.payload.employee?.firstName === 'Jean' && contract.payload.client?.companyName === 'BTP SARL' && !contract.payload.employee.fake);
  const contract2 = await call('POST', '/contracts', { ...contractBody, title: 'Mission 2', employeeId: '', clientId: '' });
  check('second contrat numéro 100002', contract2.payload.contractNumber === 100002);
  const contractGet = await call('GET', `/contracts/${contract.payload.id}`);
  check('lecture contrat', contractGet.payload.title === 'Mission test' && contractGet.payload.createdAt);
  const replaced = await call('PUT', `/contracts/${contract.payload.id}`, { ...contractGet.payload, title: 'Mission modifiée', signature: { imageData: 'xxx' } });
  check('remplacement contrat (signature non stockée)', replaced.payload.title === 'Mission modifiée' && replaced.payload.signature === undefined && replaced.payload.contractNumber === 100001);
  const contracts = await call('GET', '/contracts');
  check('liste contrats', contracts.payload.length === 2);

  // --- Pointages
  const today = new Date().toISOString().slice(0, 10);
  const te = await call('POST', '/time-entries', {
    employeeId: emp.payload.id, contractId: contract.payload.id, clientId: cli.payload.id, date: today,
    totalHours: 7, hourlyRate: 12, billingRate: 25, workType: 'normal',
  });
  check('pointage créé (employeeId en chaîne, statut draft)', te.payload.employeeId === String(emp.payload.id) && te.payload.status === 'draft' && te.payload.date === today, JSON.stringify(te.payload));
  const dup = await call('POST', '/time-entries', { employeeId: String(emp.payload.id), contractId: contract.payload.id, clientId: cli.payload.id, date: today, totalHours: 8 }, { allowError: true });
  check('doublon pointage refusé (409)', dup.status === 409 && /existe déjà/.test(dup.payload.message), JSON.stringify(dup.payload));
  const lookup = await call('GET', `/time-entries/lookup?employeeId=${emp.payload.id}&contractId=${contract.payload.id}&date=${today}`);
  check('lookup pointage', lookup.payload && lookup.payload.id === te.payload.id);
  const byRange = await call('GET', `/time-entries?startDate=${today}&endDate=${today}&status=draft`);
  check('filtre pointages par période/statut', byRange.payload.length === 1);
  const byEmp = await call('GET', `/time-entries?employeeId=${emp.payload.id}`);
  check('filtre pointages par employé', byEmp.payload.length === 1);
  const validated = await call('PATCH', `/time-entries/${te.payload.id}`, { status: 'validated', validatedAt: new Date().toISOString() });
  check('validation pointage', validated.payload.status === 'validated');
  const invoiced = await call('PATCH', `/time-entries/${te.payload.id}`, { status: 'invoiced' });
  check('pointage facturé', invoiced.payload.status === 'invoiced');
  const locked = await call('PATCH', `/time-entries/${te.payload.id}`, { totalHours: 1 }, { allowError: true });
  check('pointage facturé non modifiable (409)', locked.status === 409);
  const delLocked = await call('DELETE', `/time-entries/${te.payload.id}`, undefined, { allowError: true });
  check('pointage facturé non supprimable (409)', delLocked.status === 409);

  // --- Factures
  const num = await call('POST', '/invoices/next-number');
  check('numéro de facture FAC-AAAA-0001', /^FAC-\d{4}-0001$/.test(num.payload.invoiceNumber), num.payload.invoiceNumber);
  const inv = await call('POST', '/invoices', {
    clientId: cli.payload.id, invoiceNumber: num.payload.invoiceNumber, invoiceDate: new Date().toISOString(),
    dueDate: new Date().toISOString(), periodStart: new Date().toISOString(), periodEnd: new Date().toISOString(),
    totalAmount: 1500, status: 'draft', employeesData: [{ employeeId: emp.payload.id, totals: { totalAmount: 1500 } }],
  });
  check('facture créée (normalisation snake_case + client enrichi)', inv.payload.id === 1 && inv.payload.invoice_number === num.payload.invoiceNumber && inv.payload.client?.companyName === 'BTP SARL', JSON.stringify(inv.payload).slice(0, 200));
  const invList = await call('GET', '/invoices');
  check('liste factures avec clientCompany', invList.payload[0].clientCompany === 'BTP SARL');
  const invStatus = await call('PATCH', `/invoices/${inv.payload.id}/status`, { status: 'sent' });
  check('statut facture', invStatus.payload.status === 'sent');
  const stats = await call('GET', '/invoices/statistics');
  check('statistiques factures', stats.payload.total === 1 && stats.payload.pendingAmount === 1500, JSON.stringify(stats.payload));

  // --- Bulletins
  const slip = await call('POST', '/payslips', { employeeId: emp.payload.id, periodStart: '2026-10-01', periodEnd: '2026-10-31', lines: [], cumuls: { period: { brut: 1000 } }, status: 'draft' });
  check('bulletin créé', slip.payload.id === 1 && slip.payload.employeeId === emp.payload.id);
  const slips = await call('GET', `/payslips?employeeId=${emp.payload.id}&order=periodEnd&direction=DESC`);
  check('filtre bulletins par employé', slips.payload.length === 1);

  // --- Clé/valeur
  await call('PUT', '/kv/custom_nationalities', { value: ['MAROCAINE'] });
  const kv = await call('GET', '/kv/custom_nationalities');
  check('kv lecture/écriture', JSON.stringify(kv.payload.value) === '["MAROCAINE"]');

  // --- Tableau de bord
  const dash = await call('GET', '/dashboard/stats');
  check('dashboard stats', dash.payload.totalEmployees === 2 && dash.payload.totalContracts === 2 && dash.payload.endingSoonContracts === 2, JSON.stringify(dash.payload));
  const ending = await call('GET', '/dashboard/ending-soon');
  check('dashboard contrats bientôt terminés', ending.payload.length === 2 && ending.payload[0].endDate);

  // --- Sauvegarde / restauration
  const exp = await call('GET', '/backup/export');
  check('export complet', exp.payload.version === 2 && exp.payload.employees.length === 2 && exp.payload.timeEntries.length === 1 && exp.payload.settings.signatures.length === 1);
  const imp = await call('POST', '/backup/import', exp.payload);
  check('import complet', imp.payload.success === true && imp.payload.summary.contracts === 2, JSON.stringify(imp.payload));
  const afterImport = await call('GET', `/contracts/${contract.payload.id}`);
  check('contrat intact après restauration', afterImport.payload.contractNumber === 100001 && afterImport.payload.employee?.firstName === 'Jean');
  const empAfter = await call('POST', '/employees', { firstName: 'Nouveau', lastName: 'Après import' });
  check('séquence resynchronisée après import', empAfter.payload.id === 3, String(empAfter.payload.id));
  const contractAfter = await call('POST', '/contracts', { title: 'Après import' });
  check('compteur contrat préservé après import', contractAfter.payload.contractNumber === 100003, String(contractAfter.payload.contractNumber));
  const legacy = await call('POST', '/backup/import', { employees: exp.payload.employees, clients: exp.payload.clients, contracts: exp.payload.contracts, metadata: exp.payload.metadata });
  check('import format historique', legacy.payload.success === true);

  // --- Suppressions
  const delEmp = await call('DELETE', `/employees/${emp2.payload.id}`);
  check('suppression employé', delEmp.payload.success === true);

  // --- PDF
  if (process.env.SMOKE_SKIP_PDF !== '1') {
    for (const type of ['invoice', 'client_contract', 'employee_contract', 'certificate', 'payslip']) {
      const pdf = await call('POST', `/pdf/${type}`, { data: { company: { name: 'ATLANTIS TEST' }, invoiceNumber: 'FAC-TEST', reference: 'N° 100001', employee: {}, client: {}, cumuls: {}, totals: {}, tax: {} }, filename: `${type}.pdf` });
      const bytes = new Uint8Array(pdf.payload);
      check(`pdf ${type}`, bytes.length > 1000 && String.fromCharCode(...bytes.slice(0, 4)) === '%PDF', `${bytes.length} octets`);
    }
  }

  console.log(failures === 0 ? '\nTout est passé.' : `\n${failures} échec(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Erreur fatale :', e.message);
  process.exit(1);
});
