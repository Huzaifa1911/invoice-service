# Invoice Service

![Node.js CI](https://img.shields.io/badge/Node.js-Enabled-green)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Nx Monorepo](https://img.shields.io/badge/Nx-Monorepo-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)

> A **NestJS**-based API service to manage **users** and **invoices**.
> Managed as a **monorepo** using [Nx](https://nx.dev/).

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in `apps/invoice-app/` with the following content:

```env
# Ports
PORT=8000
NODE_ENV=development
PROJECT_NAME=Invoice App

# Backend
SECRET_KEY=2YbNFHJnPaZMGVmKrDmNkj7CZmmUTBQm
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=Password@123

# Emails
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
SMTP_TLS=True
SMTP_SSL=False
SMTP_PORT=587
EMAILS_FROM_EMAIL=info@example.com

# Postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=invoice_app
POSTGRES_USER=root
POSTGRES_PASSWORD=root

# PGAdmin
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin

# Prisma
DATABASE_URL="postgresql://root:root@localhost:5432/invoice_app?schema=public"
```

---

## 🔧 Commands Reference

| Command                                | Description                               |
| -------------------------------------- | ----------------------------------------- |
| `nx serve invoice-app`                 | Start the app in development mode         |
| `nx build invoice-app`                 | Build app for production                  |
| `nx run invoice-app:build:development` | Build in development mode                 |
| `nx run invoice-app:build:production`  | Build in production mode                  |
| `nx test invoice-app`                  | Run all tests                             |
| `nx run invoice-app:docker-build`      | Build Docker image using app’s Dockerfile |
| `nx run invoice-app:db-up`             | Start PostgreSQL via Docker Compose       |
| `nx run invoice-app:db-down`           | Stop and remove DB containers             |
| `nx run invoice-app:db-reset`          | Full DB reset (stop → start → migrate)    |
| `nx run invoice-app:init-migration`    | Create a new migration using Prisma       |
| `nx run invoice-app:migrate`           | Deploy existing migrations                |
| `nx run invoice-app:prisma-generate`   | Generate Prisma client                    |
| `nx run invoice-app:prisma-studio`     | Open Prisma Studio UI                     |

---

## 🛠️ Tech Stack

- **NestJS**
- **Prisma ORM**
- **Nx Monorepo**
- **Docker & Docker Compose**
- **Webpack CLI**
