# Contributing to SaaS Inmobiliario

Thank you for your interest in contributing!

## Development Workflow

### 1. Setup

```bash
# Clone the repo
git clone https://github.com/JulioN02/SaaS-Inmobiliario.git
cd SaaS-Inmobiliario

# Start infrastructure
docker compose up -d

# Backend setup
cd backend
npm install
npm run db:setup
npm run dev

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### 2. Branch Naming

Use descriptive branch names:

```
feat/<feature-name>       # New features
fix/<bug-name>           # Bug fixes
chore/<task-name>        # Maintenance tasks
docs/<doc-name>          # Documentation updates
refactor/<name>           # Code refactoring
```

Examples:
- `feat/properties-crud`
- `fix/login-redirect-loop`
- `chore/update-dependencies`

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(properties): add CRUD for properties
fix(auth): resolve redirect loop on expired token
docs(readme): update installation instructions
chore(deps): update axios to 1.8.0
```

### 4. Pull Requests

- Create a PR against `main`
- Fill out the PR template (automatically provided)
- Ensure CI passes before requesting review
- Request review from `@JulioN02`

### 5. Testing

```bash
# Backend tests
cd backend
npm test

# Frontend build verification
cd frontend
npm run build
```

## Architecture Guidelines

### Backend (Monolito Modular)

Each module follows the pattern:
```
modules/<module>/
├── <module>.routes.ts     # Routes + middlewares
├── <module>.controller.ts  # HTTP adapter (keep thin)
├── <module>.service.ts     # Business logic
├── <module>.repository.ts  # Prisma access (only layer with Prisma)
```

**Rules:**
- Never import Prisma outside a repository
- Never use `req.body` directly in services
- Always filter by `tenant_id` in repositories
- Controllers should be < 20 lines on average

### Frontend (React + CSS Modules)

```
src/
├── components/   # Reusable UI components
├── pages/        # Page components (route-level)
├── layouts/      # Layout components
├── hooks/        # Custom hooks
├── services/     # API calls
├── stores/       # Zustand state
├── contexts/     # React contexts
├── styles/       # Global styles and variables
└── types/        # TypeScript types
```

**Rules:**
- CSS Modules for component styling
- CSS Variables for design tokens (in `variables.css`)
- No Tailwind (unless explicitly justified)
- Keep components small and focused

## Project Structure

```
Saas-Inmobiliario/
├── backend/          # Node.js + Express + Prisma
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, tenant, property...)
│   │   ├── middlewares/
│   │   ├── shared/   # Errors, types, utilities
│   │   └── config/
│   ├── prisma/       # Schema, migrations, seeds
│   └── .github/      # CI/CD workflows
├── frontend/          # React 19 + Vite + TypeScript
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── docker-compose.yml
└── SECURITY.md
```

## Questions?

Open an Issue or email: jsoftsolutions1@gmail.com
