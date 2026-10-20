/* eslint-disable no-console */
/**
 * Démarre une instance PostgreSQL locale à partir des binaires embarqués du paquet
 * @embedded-postgres/<plateforme> (aucune installation ni Docker requis).
 * Destiné au développement et aux tests sur un poste de travail.
 *
 *   npm run db:local                    -> démarre sur le port 5433 (avant-plan, Ctrl+C pour arrêter)
 *   DB_LOCAL_PORT=5444 npm run db:local
 *
 * Chaîne de connexion :
 *   postgresql://postgres:postgres@localhost:5433/postgres
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const port = parseInt(process.env.DB_LOCAL_PORT || '5433', 10);
const root = path.resolve(__dirname, '..');
const baseDir = path.join(root, '.pg-local');
const dataDir = path.join(baseDir, 'data');
const logFile = path.join(baseDir, 'postgres.log');
const pwFile = path.join(baseDir, 'pw.txt');

function binDir() {
  const pkg = `@embedded-postgres/${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`;
  const dir = path.join(root, 'node_modules', pkg, 'native', 'bin');
  if (!fs.existsSync(dir)) {
    throw new Error(`Binaires PostgreSQL introuvables (${pkg}). Lancez "npm install" dans server/.`);
  }
  return dir;
}

function exe(name) {
  return path.join(binDir(), process.platform === 'win32' ? `${name}.exe` : name);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${path.basename(cmd)} a échoué (code ${result.status})`);
  }
}

function main() {
  fs.mkdirSync(baseDir, { recursive: true });
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('Initialisation du cluster PostgreSQL local...');
    fs.writeFileSync(pwFile, 'postgres\n');
    run(exe('initdb'), ['-D', dataDir, '-U', 'postgres', '--pwfile', pwFile, '-A', 'password', '-E', 'UTF8', '--locale=C']);
  }

  // On démarre en avant-plan via le binaire postgres pour pouvoir arrêter proprement avec Ctrl+C.
  console.log(`Démarrage de PostgreSQL local sur le port ${port}...`);
  const child = spawn(exe('postgres'), ['-D', dataDir, '-p', String(port), '-k', os.tmpdir()], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(log);
  child.stderr.on('data', (chunk) => {
    const text = String(chunk);
    log.write(text);
    if (/ready to accept connections/.test(text)) {
      console.log(`PostgreSQL local prêt : postgresql://postgres:postgres@localhost:${port}/postgres`);
      console.log('Ctrl+C pour arrêter.');
    }
    if (/FATAL|PANIC/.test(text)) {
      console.error(text.trim());
    }
  });
  child.on('exit', (code) => {
    console.log(`PostgreSQL arrêté (code ${code}).`);
    process.exit(code === null ? 0 : code);
  });

  const stop = () => {
    console.log('Arrêt de PostgreSQL local...');
    if (process.platform === 'win32') {
      spawnSync(exe('pg_ctl'), ['-D', dataDir, '-m', 'fast', 'stop'], { stdio: 'inherit' });
    } else {
      child.kill('SIGINT');
    }
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
