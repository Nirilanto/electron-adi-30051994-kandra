import { BadRequestException, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import puppeteer, { Browser } from 'puppeteer';

/** Types de documents et template associé. */
const TEMPLATES: Record<string, string> = {
  certificate: 'certificate',
  employee_contract: 'employee_contract',
  client_contract: 'client_contract',
  invoice: 'invoice',
  quote: 'invoice',
  payslip: 'payslip',
};

export const PDF_TYPES = Object.keys(TEMPLATES);

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Navigateur système (Edge / Chrome / Chromium) si Puppeteer n'a pas téléchargé le sien. */
function findSystemBrowser(): string | null {
  const env = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env && fs.existsSync(env)) return env;
  const candidates: string[] = [];
  if (process.platform === 'win32') {
    const roots = [process.env['ProgramFiles(x86)'], process.env['ProgramFiles'], process.env['LOCALAPPDATA']].filter(Boolean) as string[];
    for (const root of roots) {
      candidates.push(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
      candidates.push(path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else {
    candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable');
  }
  return candidates.find((p) => fs.existsSync(p)) || null;
}

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private readonly compiled = new Map<string, handlebars.TemplateDelegate>();
  private browser: Browser | null = null;
  private readonly templatesDir: string;

  constructor() {
    // En développement (ts-node / nest start) comme en production (dist), le dossier
    // templates se trouve à la racine du projet serveur.
    const candidates = [
      path.resolve(__dirname, '..', '..', 'templates'),
      path.resolve(__dirname, '..', 'templates'),
      path.resolve(process.cwd(), 'templates'),
    ];
    this.templatesDir = candidates.find((p) => fs.existsSync(p)) || candidates[0];

    handlebars.registerHelper('hasImage', (value: unknown) => typeof value === 'string' && value.startsWith('data:image'));
    handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  }

  private template(type: string): handlebars.TemplateDelegate {
    const name = TEMPLATES[type];
    if (!name) throw new BadRequestException(`Type de document inconnu : ${type}`);
    let tpl = this.compiled.get(name);
    if (!tpl) {
      const file = path.join(this.templatesDir, `${name}.hbs`);
      tpl = handlebars.compile(fs.readFileSync(file, 'utf8'));
      this.compiled.set(name, tpl);
    }
    return tpl;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) return this.browser;
    const executablePath = findSystemBrowser();
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };
    if (executablePath) {
      launchOptions.executablePath = executablePath;
      this.logger.log(`Navigateur PDF : ${executablePath}`);
    }
    this.browser = await puppeteer.launch(launchOptions);
    this.browser.on('disconnected', () => (this.browser = null));
    return this.browser;
  }

  /** Texte de pied de page selon le type de document. */
  private footerLabel(type: string, data: Record<string, any>): string {
    const company = data.company?.name || data.companyName || '';
    let label: string;
    if (type === 'invoice' || type === 'quote') {
      label = `${data.documentType || 'FACTURE'} N° ${data.invoiceNumber || data.quoteNumber || 'N/A'}`;
    } else if (type === 'payslip') {
      label = 'BULLETIN DE PAIE';
    } else {
      label = data.reference ? String(data.reference) : type === 'certificate' ? 'CERTIFICAT' : 'CONTRAT DE MISSION';
    }
    return [company, label].filter(Boolean).map(escapeHtml).join(' - ');
  }

  /** Rend le HTML du document (utile pour le débogage et les tests). */
  renderHtml(type: string, data: Record<string, any>): string {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const enhanced = {
      ...data,
      generationDate: data.generationDate || formattedDate,
      year: data.year || now.getFullYear(),
    };
    return this.template(type)(enhanced);
  }

  async generate(type: string, data: Record<string, any>): Promise<Buffer> {
    const html = this.renderHtml(type, data || {});
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setBypassCSP(true);
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '10mm', bottom: '18mm', left: '10mm' },
        preferCSSPageSize: false,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0; padding: 5px 0;">
            <span style="float: left; margin-left: 10mm;">${this.footerLabel(type, data || {})}</span>
            <span style="float: right; margin-right: 10mm;">
              Page <span class="pageNumber"></span> sur <span class="totalPages"></span>
            </span>
          </div>`,
        scale: 0.95,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close().catch(() => undefined);
      this.browser = null;
    }
  }
}
