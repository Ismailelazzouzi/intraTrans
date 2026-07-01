*This project has been created as part of the 42 curriculum by isel-azz, fbalyout, sel-moud, ouel-bou, msaadaou.*

---

# The Hive

**The Hive** is a real-time service marketplace that connects **Clients** (homeowners, office owners, etc.) with verified **Tradesmen (Providers)**. Clients post broadcast job requests, providers respond and get hired, and the whole workflow — from posting to project completion — is tracked in one place. Built as a full-stack web application with real-time communication, role-based access control, and a production-grade DevOps infrastructure.

---

## Table of Contents

- [Description](#description)
- [Instructions](#instructions)
- [Team Information](#team-information)
- [Project Management](#project-management)
- [Technical Stack](#technical-stack)
- [Database Schema](#database-schema)
- [Features List](#features-list)
- [Modules](#modules)
- [Individual Contributions](#individual-contributions)
- [Resources](#resources)

---

## Description

### Key Features

- **Broadcast System** — Clients post job requests (broadcasts); providers respond and get confirmed
- **Project Tracking** — Broadcasts convert into projects with multi-provider support and role assignments
- **Real-time Chat** — WebSocket-powered messaging between users, with group conversation support
- **Trusted Relations** — Clients can build a trusted network of verified providers
- **Role-based Access** — Five user types: `ROOT`, `ADMIN`, `CLIENT`, `PROVIDER`, `PENDING`
- **Provider Verification** — Providers submit credentials and are reviewed by admins before going live
- **Google OAuth 2.0** — Sign in with Google in addition to classic email/password
- **Admin Dashboard** — Manage users, approve/reject providers, and view audit logs
- **Observability Stack** — Prometheus + Grafana dashboards and health checks
- **Security Hardening** — ModSecurity WAF, HashiCorp Vault for secret management, HTTPS-only in production

---

## Instructions

### Prerequisites

| Software | Version | Notes |
|----------|---------|-------|
| Docker | 24+ | With Compose plugin v2 |
| Make | any | GNU Make |
| OpenSSL | any | For TLS cert generation (prod only) |

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `DATABASE_URL` | Full Prisma connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `REFRESH_SECRET` | Refresh token secret (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |
| `FRONTEND_URL` | Frontend origin URL |
| `METRICS_SECRET` | Bearer token protecting `/metrics` endpoint |
| `VAULT_TOKEN` | HashiCorp Vault root token |
| `GRAFANA_ADMIN_USER` | Grafana admin username (prod only) |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password (prod only) |
| `DISCORD_WEBHOOK_URL` | Optional: Grafana alert notifications |

### Development

```bash
# Start all containers in development mode (with hot-reload)
make up

# Build and start
make build

# View logs
make logs

# Stop containers
make down

# Stop and remove volumes (destructive)
make clean
```

The frontend is available at `http://localhost:8080`.

### Production

TLS certificates are generated automatically on first run if missing:

```bash
# Build and start production stack (generates certs if needed)
make build-prod

# Or just start without rebuilding images
make up-prod

# View logs
make logs-prod

# Stop
make down-prod

# Nuclear reset — removes all containers, volumes, images, and certs
make fclean
```

The application is served at `https://localhost` (port 443) behind Nginx + ModSecurity WAF.

---

## Team Information

| Login | Role | Responsibilities |
|-------|------|-----------------|
| `isel-azz` | Product Owner | Defines product vision, prioritizes features, maintains the backlog, validates completed work, communicates with evaluators |
| `ouel-bou` | Project Manager / Scrum Master | Organizes team meetings and sprints, tracks progress and deadlines, manages risks and blockers, ensures team communication |
| `sel-moud` | Technical Lead / Architect | Defines technical architecture, makes technology stack decisions, ensures code quality and best practices, reviews critical changes |
| `fbalyout` | Developer | Implements assigned features and modules, participates in code reviews, tests implementations, documents work |
| `msaadaou` | Developer | Implements assigned features and modules, participates in code reviews, tests implementations, documents work |

---

## Project Management

- **Work organization**: Modules were claimed via a custom Discord bot command (`/claim`) integrated with GitHub Issues. Claiming a module automatically created a feature issue and a project board card. Sub-issues represented individual tasks broken down from the module, tracked on a GitHub Project board.
- **Task tracking**: GitHub Issues + GitHub Projects (automated via Discord bot)
- **Communication**: Discord server — used for daily coordination, bot notifications, and module claiming
- **Code reviews**: Pull requests required for all feature branches; at least one reviewer per PR
- **Branching strategy**: Feature branches merged into `main` via PR with descriptive commit messages

---

## Technical Stack

### Frontend

| Technology | Version | Justification |
|------------|---------|---------------|
| React | 18 | Component-based UI framework with a mature ecosystem and TypeScript support |
| TypeScript | 5 | Static typing catches bugs at compile time and improves maintainability |
| React Router | 6 | Client-side routing for a smooth SPA experience |
| Socket.io-client | 4 | Real-time bidirectional communication for the chat system |
| Zod | 3 | Schema-based validation shared with backend contracts |

### Backend

| Technology | Version | Justification |
|------------|---------|---------------|
| Node.js | 20 | Non-blocking I/O well-suited to real-time WebSocket workloads |
| Express | 4 | Lightweight, well-documented HTTP framework with broad middleware support |
| TypeScript | 5 | End-to-end type safety across the full stack |
| Prisma | 5 | Type-safe ORM with auto-generated migrations and excellent PostgreSQL support |
| Socket.io | 4 | WebSocket server for real-time chat with room and broadcast support |
| Passport.js | — | Authentication middleware with Google OAuth 2.0 strategy |
| Zod | 3 | Runtime request validation and schema sharing with the frontend |
| Pino | — | Fast structured JSON logging with JSON output to Docker log driver |
| prom-client | — | Exposes a `/metrics` endpoint scraped by Prometheus |

### Database

| Technology | Version | Justification |
|------------|---------|---------------|
| PostgreSQL | 15 | Relational model fits the project's structured data (users, projects, messages); ACID compliance ensures data integrity |

### Infrastructure & DevOps

| Technology | Role |
|------------|------|
| Docker + Compose | Containerization; single-command deployment for both dev and prod |
| Nginx | Reverse proxy, TLS termination, static file serving |
| ModSecurity (OWASP CRS) | Web Application Firewall — blocks SQLi, XSS, and common attack patterns |
| HashiCorp Vault | Secrets management — stores API keys, DB credentials, and JWT secrets |
| Prometheus | Metrics collection from all exporters |
| Grafana | Dashboards and alerting on collected metrics |
| cAdvisor | Container-level resource metrics |
| Node Exporter | Host-level system metrics |
| Postgres Exporter | PostgreSQL-specific metrics |
| Nginx Exporter | Nginx request and connection metrics |

---

## Database Schema

### Models Overview

```
User ─────────────────────────────────────────────────────────────
  id (uuid PK), firstName, lastName, email (unique), password?,
  googleId?, phoneNumber?, type (UserType), imageUrl, timestamps

  ├── RefreshToken[]          — active JWT refresh tokens
  ├── Provider?               — extended profile if user is a PROVIDER
  ├── TrustedRelation[]       — network of trusted providers (as Client)
  ├── Broadcast[]             — broadcasts created (as Client)
  ├── ConversationParticipant[] — chat rooms joined
  ├── Message[]               — messages sent
  ├── Project[]               — projects owned (as Client)
  └── AuditLog[]              — admin actions performed

Provider ────────────────────────────────────────────────────────
  id (uuid PK), userId (FK → User, unique), license?, profession?,
  description?, isVerified (VerificationStatus), timestamps

  ├── BroadcastResponse[]     — responses submitted to broadcasts
  ├── Broadcast[]             — broadcasts where confirmed as provider
  ├── ProjectProvider[]       — projects this provider is assigned to
  └── TrustedRelation[]       — relationships with clients

TrustedRelation ─────────────────────────────────────────────────
  id, userId (FK → User), providerId (FK → Provider),
  status (PENDING | ACCEPTED | REJECTED | BLOCKED), timestamps
  UNIQUE(userId, providerId)

Broadcast ───────────────────────────────────────────────────────
  id, userId (FK → User/Client), title, description?, location?,
  status (OPEN | IN_PROGRESS | CLOSED | CANCELLED),
  type (NORMAL | GROUP), maxProviders?, providerConfirmedId?,
  timestamps

  ├── BroadcastResponse[]     — provider applications
  └── Project?                — project spawned from this broadcast

BroadcastResponse ───────────────────────────────────────────────
  id, broadcastId (FK → Broadcast), providerId (FK → Provider),
  status (PENDING | ACCEPTED | REJECTED | WITHDRAWN), timestamps
  UNIQUE(broadcastId, providerId)

Project ─────────────────────────────────────────────────────────
  id, clientId (FK → User), broadcastId? (FK → Broadcast, unique),
  status (DRAFT | ACTIVE | COMPLETED | CANCELLED), timestamps

  └── ProjectProvider[]       — providers assigned to this project

ProjectProvider ─────────────────────────────────────────────────
  id, projectId (FK → Project), providerId (FK → Provider),
  status (INVITED | ACTIVE | REMOVED | COMPLETED),
  role (LEAD | COLLABORATOR | OBSERVER), timestamps
  UNIQUE(projectId, providerId)

Conversation ────────────────────────────────────────────────────
  id, name?, isGroup (bool), timestamps

  ├── ConversationParticipant[] — members
  └── Message[]               — message history

ConversationParticipant ─────────────────────────────────────────
  conversationId (FK), userId (FK → User)
  PK(conversationId, userId)

Message ─────────────────────────────────────────────────────────
  id, conversationId (FK → Conversation), senderId (FK → User),
  content, type (TEXT | FILE), timestamps

AuditLog ────────────────────────────────────────────────────────
  id, action (AdminAction enum), performedBy (FK → User),
  targetId?, createdAt
```

### UserType Enum

| Value | Description |
|-------|-------------|
| `PENDING` | Newly registered, role not yet assigned |
| `CLIENT` | Can post broadcasts and hire providers |
| `PROVIDER` | Can respond to broadcasts and be assigned to projects |
| `ADMIN` | Can approve/reject providers and manage users |
| `ROOT` | Superuser with unrestricted access |

---

## Features List

### Authentication & User Management

| Feature | Description | Implemented by |
|---------|-------------|----------------|
| Email/password registration | Secure signup with hashed and salted passwords (bcrypt) | sel-moud, msaadaou |
| JWT authentication | Access + refresh token pair with rotation | sel-moud, msaadaou |
| Google OAuth 2.0 | Sign in with Google via Passport.js | sel-moud, isel-azz |
| User profile management | Update name, avatar, phone number, and account type | isel-azz, sel-moud, msaadaou |
| Avatar upload | File upload with server-side validation via Multer | isel-azz, sel-moud, msaadaou |
| Admin panel | CRUD on users, promote to admin, audit log | sel-moud, msaadaou, isel-azz |
| Provider verification | Providers submit credentials; admins approve or reject | sel-moud, msaadaou, isel-azz |
| Role-based authorization | Middleware enforces permissions per route by UserType | sel-moud, msaadaou, isel-azz |

### Broadcast & Project System

| Feature | Description | Implemented by |
|---------|-------------|----------------|
| Create broadcast | Clients post job requests with title, description, location | isel-azz, sel-moud, msaadaou |
| Browse & respond | Providers view open broadcasts and submit applications | isel-azz, sel-moud, msaadaou |
| Confirm provider | Client selects a provider; broadcast moves to IN_PROGRESS | sel-moud, msaadaou |
| Group broadcasts | Multiple providers can be invited to a single broadcast | sel-moud, msaadaou |
| Project lifecycle | Broadcasts spawn projects tracked through DRAFT → COMPLETED | sel-moud, msaadaou |
| Project provider roles | Providers assigned as LEAD, COLLABORATOR, or OBSERVER | sel-moud, msaadaou |

### Social & Communication

| Feature | Description | Implemented by |
|---------|-------------|----------------|
| Real-time chat | WebSocket-powered 1-to-1 and group messaging via Socket.io | isel-azz, sel-moud, msaadaou |
| Trusted relations | Clients build a trusted network of providers (accept/reject/block) | isel-azz, sel-moud, msaadaou |
| User profiles | View any user's public profile page | isel-azz, sel-moud, msaadaou |
| Advanced search | Filter, sort, and paginate broadcasts and users | isel-azz |
| Custom design system | Reusable UI component library with consistent palette and typography | isel-azz |

### DevOps & Observability

| Feature | Description | Implemented by |
|---------|-------------|----------------|
| Prometheus metrics | `/metrics` endpoint + exporters for Postgres, Nginx, Node, containers | ouel-bou |
| Grafana dashboards | Custom dashboards with alerting (Discord webhook) | ouel-bou |
| Health checks & status page | Docker health checks on all containers; `/healthz` endpoint; backup and recovery procedures | ouel-bou |
| WAF (ModSecurity) | OWASP CRS rules blocking SQLi, XSS, and common exploits | fbalyout |
| HashiCorp Vault | Runtime secret injection; no secrets in environment at container level | fbalyout |
| TLS (self-signed) | HTTPS enforced in production; auto-generated certs via `init-certs.sh` | fbalyout |

---

## Modules

**Total: 19 points** (minimum required: 14) — 7 major modules × 2pts + 5 minor modules × 1pt

### Web

| Module | Type | Points | Implemented by |
|--------|------|--------|----------------|
| Use a framework for both frontend (React) and backend (Express) | Major | 2 | isel-azz (frontend), sel-moud, msaadaou (backend) |
| Real-time features using WebSockets (Socket.io) | Major | 2 | isel-azz, sel-moud, msaadaou |
| Allow users to interact: chat, profiles, trusted relations | Major | 2 | isel-azz, sel-moud, msaadaou |
| ORM for the database (Prisma) | Minor | 1 | sel-moud, msaadaou |
| Custom-made design system with reusable components (10+ components) | Minor | 1 | isel-azz |
| Advanced search with filters, sorting, and pagination | Minor | 1 | isel-azz |

### User Management

| Module | Type | Points | Implemented by |
|--------|------|--------|----------------|
| Standard user management and authentication (register, login, profile, JWT) | Major | 2 | msaadaou, isel-azz |
| Remote authentication with OAuth 2.0 (Google) | Minor | 1 | sel-moud, isel-azz |
| Advanced permissions system (roles: ROOT/ADMIN/CLIENT/PROVIDER/PENDING) | Major | 2 | sel-moud, msaadaou, isel-azz |

### Cybersecurity

| Module | Type | Points | Implemented by |
|--------|------|--------|----------------|
| WAF (ModSecurity/OWASP CRS) + HashiCorp Vault for secrets | Major | 2 | fbalyout |

### DevOps

| Module | Type | Points | Implemented by |
|--------|------|--------|----------------|
| Monitoring system with Prometheus and Grafana | Major | 2 | ouel-bou |
| Health check and status page with automated backups and disaster recovery | Minor | 1 | ouel-bou |

### Module justifications

- **Frameworks (Web — Major)**: React provides a component model and reactive state management critical for a real-time UI. Express gives a lightweight, well-understood HTTP layer that pairs cleanly with Socket.io and Prisma.
- **WebSockets (Web — Major)**: The chat system requires true bidirectional real-time communication. Socket.io was chosen for its room abstraction, reconnection handling, and built-in fallback transport.
- **User interaction (Web — Major)**: The trusted-relation network and real-time chat are core to the platform's value proposition of connecting clients with known, trusted tradesmen.
- **Prisma ORM (Web — Minor)**: Type-safe database access with auto-generated migrations reduces SQL errors and accelerates schema evolution without raw query maintenance.
- **Custom design system (Web — Minor)**: A consistent, reusable component library (10+ components) ensures visual coherence across all pages and accelerates frontend development.
- **Advanced search (Web — Minor)**: A service marketplace needs robust discoverability. Filtering by profession, location, and status combined with sorting and pagination makes the platform usable at scale.
- **Standard user management (User Management — Major)**: Secure email/password registration with bcrypt, JWT access + refresh token rotation, profile management, and avatar upload form the authentication backbone of the platform.
- **Google OAuth (User Management — Minor)**: Lowers the friction for new users while delegating credential security to Google.
- **Advanced permissions (User Management — Major)**: A five-tier role system (ROOT → ADMIN → CLIENT → PROVIDER → PENDING) is necessary to enforce the marketplace's trust model and admin workflows.
- **WAF + Vault (Cybersecurity — Major)**: ModSecurity blocks common web attacks at the edge. Vault ensures no plaintext secrets exist in environment files or container configs at runtime.
- **Prometheus + Grafana (DevOps — Major)**: Metrics collection across all services with visual dashboards and Discord alerting provides the operational visibility needed to maintain the production stack.
- **Health check + backups (DevOps — Minor)**: Docker health checks on every container, a `/healthz` endpoint, and documented backup and disaster recovery procedures ensure the platform can be reliably operated and restored.

---

## Individual Contributions

### isel-azz — Product Owner

- Built the entire React frontend: component architecture, routing, pages, and UI/UX
- Designed and implemented the custom design system (reusable component library: buttons, inputs, cards, modals, loaders, etc.)
- Implemented advanced search with filters, sorting, and pagination on the frontend
- Integrated Google OAuth 2.0 on the frontend (login flow, token handling)
- Implemented frontend side of real-time features (Socket.io-client integration, chat UI)
- Implemented frontend side of user interaction (chat, profiles, trusted relations)
- Implemented frontend side of the advanced permissions system (role-aware views and routes)
- Maintained the product backlog and feature prioritization throughout the project

### fbalyout — Developer

- Implemented the Cybersecurity module: WAF (ModSecurity/OWASP CRS) configuration and hardening in Nginx
- Set up HashiCorp Vault for runtime secret injection (init scripts, policies, secret paths)
- Ensured no plaintext secrets are exposed in container environments at runtime

### sel-moud — Technical Lead

- Defined the overall system architecture: monolith Express backend, SPA React frontend, PostgreSQL with Prisma, containerized via Docker Compose
- Implemented the backend framework (Express + TypeScript structure, middleware stack, error handling)
- Designed and implemented the full database schema with Prisma (all models, migrations, relations)
- Built the authentication system: JWT (access + refresh tokens), bcrypt hashing, refresh token rotation
- Integrated Google OAuth 2.0 on the backend (Passport.js strategy, user provisioning)
- Implemented real-time features on the backend (Socket.io server, room management, event handling)
- Built the user interaction backend: chat API, trusted relations, profile endpoints
- Implemented the advanced permissions system: role middleware, route guards, admin endpoints
- Reviewed all critical PRs and enforced coding standards across the team

### ouel-bou — Project Manager / Developer

- **Project management**: Organized sprints and meetings, tracked module ownership via GitHub Issues + Discord bot, unblocked the team on infrastructure questions
- **Prometheus + Grafana (DevOps — Major)**: Prometheus scrape config for all exporters (Node, Postgres, Nginx, cAdvisor); custom Grafana dashboards with Discord webhook alerting
- **Health checks & disaster recovery (DevOps — Minor)**: Docker health checks on every service, `/healthz` endpoint on the webserver, backup and recovery procedures
- **Infrastructure automation**: TLS certificate generation integrated into Makefile (`make up-prod` / `make build-prod` auto-generate certs if missing; `make fclean` removes them)
- **Production Nginx configuration**: Reverse proxy routing, TLS termination, security headers

### msaadaou — Developer

- Implemented backend features alongside sel-moud: broadcast system (CRUD, responses, confirmation), project lifecycle management, project provider role assignments
- Implemented the ORM layer with Prisma: query logic, service layer, data access patterns
- Built real-time backend features (Socket.io) for chat and live updates
- Implemented backend side of the advanced permissions system (role checks, admin actions, audit logging)
- Participated in code reviews and wrote tests for implemented features

---

## Resources

### Documentation & References

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [Passport.js — Google OAuth Strategy](https://www.passportjs.org/packages/passport-google-oauth20/)
- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [ModSecurity / OWASP CRS](https://owasp.org/www-project-modsecurity-core-rule-set/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)

### AI Usage

AI tools (Claude, GitHub Copilot) were used in this project for the following tasks:

- **Infrastructure debugging**: Diagnosing container health-check behaviour, Prometheus scrape failures, and Grafana provisioning issues
- **Boilerplate generation**: Scaffolding repetitive CRUD route handlers and Zod validation schemas, which were then reviewed and adapted by team members
- **Documentation drafting**: Initial drafts of this README and inline code comments, reviewed and corrected by the team
- **Code review assistance**: Identifying potential security issues in middleware and input validation logic

All AI-generated content was reviewed, tested, and understood by the team member responsible for the relevant area before being committed.
