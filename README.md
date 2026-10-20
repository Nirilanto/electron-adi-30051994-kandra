# Contrat Manager

Application web de gestion de contrats de mission temporaire : employés, clients,
contrats, pointage, factures, bulletins de paie, génération de PDF.

- **Front** : React 18 + TailwindCSS (dossier `src/`)
- **API** : NestJS + Prisma (dossier `server/`)
- **Base de données** : PostgreSQL
- **PDF** : Handlebars + Puppeteer, générés par le serveur
- **Multi-utilisateurs** : comptes avec mot de passe, rôles `admin` / `user`

## Démarrage rapide (développement)

Prérequis : Node.js 20 ou plus récent.

```bash
# 1. Dépendances
npm install
npm run api:install

# 2. Configuration de l'API
cp server/.env.example server/.env      # puis adapter DATABASE_URL et JWT_SECRET

# 3. Base de données
#    - soit un PostgreSQL existant (DATABASE_URL dans server/.env)
#    - soit l'instance locale embarquée (aucune installation) :
npm run db:local                        # laisse tourner dans un terminal, port 5433
#      DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres?schema=public
npm run db:migrate                      # applique les migrations

# 4. Lancer l'API et le front
npm run dev                             # API sur :3001, front sur :3000
```

Au premier lancement, l'écran de connexion propose de **créer le compte
administrateur**. Les autres comptes se créent ensuite dans
*Paramètres → Utilisateurs*.

Scripts utiles :

| Commande | Rôle |
| --- | --- |
| `npm run dev` | API (rechargement à chaud) + front |
| `npm run build` | build de production du front |
| `npm run api:build` | build de production de l'API |
| `npm run api:smoke` | test de fumée de l'API (base vide recommandée) |
| `npm run db:reset` | vide toutes les tables (développement uniquement) |

## Déploiement (Linux, Docker Compose)

```bash
cp .env.docker.example .env.docker      # définir POSTGRES_PASSWORD et JWT_SECRET
docker compose --env-file .env.docker up -d --build
```

Le site est servi sur `http://<serveur>:8080` (variable `WEB_PORT`). Nginx sert le
front et proxifie `/api` vers l'API ; les données PostgreSQL sont dans le volume
`pgdata`. Placer un reverse proxy HTTPS (Caddy, Traefik, nginx + certbot) devant
le port 8080 pour une exposition sur Internet : l'application manipule des données
personnelles sensibles (numéros de sécurité sociale, salaires).

Sauvegarde de la base :

```bash
docker compose --env-file .env.docker exec db pg_dump -U contrat contrat_manager > backup.sql
```

L'export JSON complet reste disponible dans *Paramètres → Import/Export*.

## Architecture

```
src/                      Front React
├── services/
│   ├── ApiClient.js      client HTTP (jeton JWT, erreurs)
│   ├── AuthService.js    connexion, comptes
│   ├── DatabaseService.js façade de données (même API qu'avant, appels HTTP)
│   └── PdfClient.js      génération PDF via le serveur
└── modules/              dashboard, employees, clients, contracts, timetracking,
                          invoices, payroll, settings

server/                   API NestJS
├── prisma/schema.prisma  schéma PostgreSQL + migrations
├── templates/*.hbs       templates PDF (contrats, certificat, facture, bulletin)
└── src/
    ├── auth, users       authentification JWT, gestion des comptes
    ├── employees, clients, contracts, time-entries, invoices, payslips
    ├── settings          entreprise, listes de référence, signatures
    ├── counters          numéros de contrat / facture (atomiques)
    ├── dashboard, backup, kv, pdf
    └── common            garde JWT, rôles, utilitaires de conversion
```

### Modèle de données

Chaque entité possède des colonnes typées (identifiants, clés étrangères, statuts,
dates, montants) servant aux filtres, tris et à l'intégrité relationnelle, plus une
colonne `data` JSONB conservant le document complet manipulé par le front. Les
colonnes typées sont recalculées à chaque écriture. Ce choix garantit l'absence de
régression fonctionnelle tout en permettant les requêtes SQL et les sauvegardes
standard de PostgreSQL.

### Points d'API principaux

Toutes les routes sont préfixées par `/api` et exigent un jeton `Bearer`, sauf
`/health`, `/auth/status`, `/auth/setup` et `/auth/login`.

| Ressource | Routes |
| --- | --- |
| Employés / Clients / Factures / Bulletins | `GET POST /x`, `GET PUT PATCH DELETE /x/:id` |
| Contrats | idem + `POST /contracts/next-number`, `POST /contracts/cleanup` |
| Pointages | idem + `GET /time-entries/lookup`, `POST /time-entries/import`, `POST /time-entries/cleanup` |
| Factures | + `GET /invoices/statistics`, `POST /invoices/next-number`, `PATCH /invoices/:id/status` |
| Paramètres | `GET PUT /settings/company`, `GET POST PUT /settings/lists/:kind`, `DELETE /settings/lists/:kind/:id`, `GET POST DELETE /settings/signatures` |
| Tableau de bord | `GET /dashboard/stats`, `GET /dashboard/ending-soon` |
| Sauvegarde | `GET /backup/export`, `POST /backup/import` (admin) |
| PDF | `POST /pdf/:type` (`client_contract`, `employee_contract`, `certificate`, `invoice`, `quote`, `payslip`) |
| Utilisateurs | `GET POST /users`, `PATCH DELETE /users/:id` (admin), `POST /auth/change-password` |
| Clé/valeur | `GET PUT DELETE /kv/:key` |
