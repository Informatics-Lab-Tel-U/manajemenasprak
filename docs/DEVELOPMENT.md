# Development Guide - Sistem Manajemen Asprak

**Document Type**: Developer Guide  
**Last Updated**: March 16, 2026  
**Status**: Active

---

## 📑 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Running Locally](#running-locally)
6. [Database Management](#database-management)
7. [Coding Standards](#coding-standards)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [Common Issues](#common-issues)

---

## ✅ Prerequisites

### System Requirements

- **OS**: Windows, macOS, or Linux
- **Node.js**: 18.x or higher
- **npm**: 8+ or yarn/pnpm equivalent
- **Git**: Latest version
- **Text Editor**: VS Code recommended

### Verify Installation

```bash
node --version      # Should show v18.x or higher
npm --version       # Should show 8+ or higher
git --version       # Should show latest

# Optional but recommended
code --version      # VS Code version
```

### Required Accounts

1. **GitHub**: Access to repository
2. **Supabase**: Create free account at https://supabase.com
   - Need Project URL
   - Need Anon Key
   - Need Service Role Key

---

## 🚀 Initial Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/manajemen-asprak.git
cd manajemen-asprak/webapp
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm (faster)
pnpm install
```

### Step 3: Create Environment File

```bash
# Copy example environment file
cp .env.example .env.local
```

### Step 4: Configure Supabase

Edit `.env.local` and add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application
NEXT_PUBLIC_APP_NAME=Sistem Manajemen Asprak
NODE_ENV=development
```

**Where to find these values**:

1. Go to https://supabase.com → Sign in
2. Select your project
3. Go to Settings → API
4. Copy the values and paste to `.env.local`

### Step 5: Seed Database (First Time Only)

```bash
# Run seed script to populate initial data
npx tsx scripts/seed.ts
```

This creates:

- Sample users (admin, aslab, coordinator)
- Sample courses and practicum
- Sample schedules

### Step 6: Start Development Server

```bash
npm run dev
```

Output should show:

```
> next dev
  ▲ Next.js 16.1
  ✓ Ready in 2.5s
  ➜ Local:        http://localhost:3000
```

### Step 7: Open Browser

Navigate to http://localhost:3000 and login with sample credentials.

---

## 📁 Project Structure

```
web app/
│
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── globals.css                        # Global styles
│   │   ├── layout.tsx                         # Root layout
│   │   ├── (auth)/                            # Auth pages
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/                       # Protected pages
│   │   │   ├── layout.tsx                     # Dashboard layout
│   │   │   ├── page.tsx                       # Home/Dashboard
│   │   │   ├── asprak/
│   │   │   │   └── page.tsx                   # Asprak management
│   │   │   ├── jadwal/
│   │   │   │   └── page.tsx                   # Schedule management
│   │   │   ├── pelanggaran/
│   │   │   │   ├── page.tsx                   # Violation tracking
│   │   │   │   └── pelanggaran-rekap/        # Violation summary
│   │   │   ├── plotting/
│   │   │   │   └── page.tsx                   # Assignment plotting
│   │   │   ├── mata-kuliah/
│   │   │   │   └── page.tsx                   # Course management
│   │   │   ├── praktikum/
│   │   │   │   └── page.tsx                   # Practicum management
│   │   │   ├── manajemen-akun/
│   │   │   │   └── page.tsx                   # User management
│   │   │   ├── audit-logs/
│   │   │   │   └── page.tsx                   # Audit trail viewer
│   │   │   ├── pengaturan/
│   │   │   │   └── page.tsx                   # Settings
│   │   │   └── panduan/
│   │   │       └── page.tsx                   # User guide
│   │   ├── api/                               # API routes
│   │   │   ├── asprak/
│   │   │   │   └── route.ts                   # Asprak endpoints
│   │   │   ├── jadwal/
│   │   │   │   └── route.ts
│   │   │   ├── pelanggaran/
│   │   │   │   └── route.ts
│   │   │   ├── plotting/
│   │   │   │   └── route.ts
│   │   │   ├── import/
│   │   │   ├── export/
│   │   │   ├── admin/
│   │   │   │   └── users/
│   │   │   ├── system/
│   │   │   └── ...
│   │   └── maintenance/
│   │       └── page.tsx
│   │
│   ├── components/                            # React Components
│   │   ├── DashboardCharts.tsx
│   │   ├── DashboardClient.tsx
│   │   ├── theme-provider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── ui/                                # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── asprak/                            # Feature components
│   │   │   ├── AsprakAddModal.tsx
│   │   │   ├── AsprakEditModal.tsx
│   │   │   ├── AsprakDeleteDialog.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   ├── sidebar/
│   │   └── ...
│   │
│   ├── hooks/                                 # Custom React Hooks
│   │   ├── index.ts
│   │   ├── use-mobile.ts
│   │   ├── useAsprak.ts                       # Asprak data fetching
│   │   ├── useDashboard.ts
│   │   ├── useJadwal.ts                       # Schedule data fetching
│   │   ├── useMataKuliah.ts
│   │   ├── usePelanggaran.ts
│   │   ├── usePraktikum.ts
│   │   ├── useScheduleData.ts
│   │   └── useTahunAjaran.ts
│   │
│   ├── lib/                                   # Utilities & Configuration
│   │   ├── auth.ts                            # Auth utilities & middleware
│   │   ├── logger.ts                          # Logging utility
│   │   ├── utils.ts                           # General utilities
│   │   ├── supabase/
│   │   │   ├── client.ts                      # Client-side Supabase
│   │   │   ├── server.ts                      # Server-side Supabase
│   │   │   └── admin.ts                       # Admin client
│   │   └── fetchers/
│   │       └── ...
│   │
│   ├── services/                              # Business Logic (Server-side)
│   │   ├── asprakService.ts                   # Asprak operations
│   │   ├── auditLogService.ts                 # Audit logging
│   │   ├── databaseService.ts
│   │   ├── jadwalService.ts                   # Schedule operations
│   │   ├── mataKuliahService.ts              # Course operations
│   │   ├── modulScheduleService.ts
│   │   ├── pelanggaranService.ts             # Violation operations
│   │   ├── plottingService.ts                # Plotting operations
│   │   ├── praktikumService.ts               # Practicum operations
│   │   ├── supabase.ts                       # Supabase client setup
│   │   ├── systemService.ts                  # System operations
│   │   ├── termService.ts                    # Term/year operations
│   │   └── index.ts
│   │
│   ├── types/                                 # TypeScript Types
│   │   ├── api.ts                             # API request/response types
│   │   └── database.ts                        # Database types
│   │
│   ├── utils/                                 # Utility Functions
│   │   ├── asprak.ts
│   │   ├── asprakCodeGenerator.ts            # Code generation
│   │   ├── colorUtils.ts
│   │   ├── conflict.ts
│   │   ├── excelImport.ts                    # Excel/CSV handling
│   │   ├── term.ts
│   │   └── validation/
│   │
│   └── middleware.ts                          # Next.js middleware
│
├── scripts/                                   # Utility Scripts
│   ├── seed.ts                                # Database seeding
│   ├── test_fetch.ts                         # Test data fetching
│   ├── test_enum.ts                          # Test enumerations
│   └── test_ruangan.ts                       # Test room data
│
├── docs/                                      # Documentation (YOU ARE HERE)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DATABASE.md
│   ├── DEVELOPMENT.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── TROUBLESHOOTING.md
│   └── CHANGELOG.md
│
├── public/                                    # Static Assets
│   ├── favicon/
│   └── references/
│       └── 2425-1/                            # Sample data files
│           ├── asprak.csv
│           ├── jadwal.csv
│           ├── mata_kuliah.csv
│           ├── praktikum.csv
│           └── asprak_praktikum.csv
│
├── db/                                        # Database Files
│   └── schema.sql                             # Database schema
│
├── Configuration Files
│   ├── next.config.ts                        # Next.js config
│   ├── tsconfig.json                         # TypeScript config
│   ├── tailwind.config.ts                    # Tailwind CSS config
│   ├── postcss.config.mjs                    # PostCSS config
│   ├── eslint.config.mjs                     # ESLint config
│   ├── components.json                       # Shadcn UI config
│   ├── package.json                          # Dependencies
│   └── .env.example                          # Environment template
│
└── Other Files
    ├── README.md
    ├── CLAUDE.md                              # AI coding guidance
    └── middleware.ts                          # Auth middleware
```

---

## 💼 Development Workflow

### 1. Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch (use descriptive name)
git checkout -b feat/add-asprak-import
```

**Branch naming convention**:

- `feat/`: New features
- `fix/`: Bug fixes
- `docs/`: Documentation
- `refactor/`: Code refactoring
- `chore/`: Build, config, etc.

### 2. Make Changes

Code your feature in the branch. Follow [Coding Standards](#coding-standards).

### 3. Format & Lint

```bash
# Format code
npm run format

# Check linting
npm run lint

# Fix lint errors
npm run lint --fix
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message (Conventional Commits)
git commit -m "feat: add CSV import for asprak data"

# Other examples
git commit -m "fix: prevent duplicate NIM insertion"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify conflict detection logic"
```

### 5. Push and Create PR

```bash
# Push to remote
git push origin feat/add-asprak-import

# Create Pull Request on GitHub
# - Add description
# - Link related issues
# - Request reviewers
```

### 6. Code Review

- Address review feedback
- Make additional commits if needed
- Request re-review when ready

### 7. Merge to Main

Once approved:

```bash
git checkout main
git pull origin main
git merge --squash feat/add-asprak-import
git commit -m "feat: add asprak CSV import"
git push origin main
```

---

## 🏃 Running Locally

### Development Mode (with hot reload)

```bash
npm run dev
```

Server runs at `http://localhost:3000`. Changes auto-reload in browser.

### Production Build (local testing)

```bash
# Build
npm run build

# Start production server
npm start
```

### Check for Type Errors

```bash
npx tsc --noEmit
```

---

## 💾 Database Management

### View Database in Browser

```bash
# Supabase Dashboard
https://supabase.com → Select Project → Table Editor
```

### Reset Database (Development Only)

```bash
# This deletes all data and re-seeds
npx tsx scripts/seed.ts --reset
```

### Test Database Connection

```bash
# Run connection test
npx tsx scripts/test_fetch.ts
```

### Migrate Database Schema

When schema changes occur:

```bash
# Supabase automatically handles migrations
# Just pull latest changes from git
git pull origin main

# Re-seed if needed
npx tsx scripts/seed.ts
```

### Export Database (Backup)

```bash
# Use Supabase UI to export
# Settings → Backups → Download CSV
```

---

## 📝 Coding Standards

### TypeScript

- ✅ Use strict type checking
- ✅ Define interfaces for data structures
- ✅ Avoid `any` type
- ❌ Don't use `var`, use `const` or `let`

```typescript
// ✅ Good
interface Asprak {
  id: string;
  nim: string;
  nama_lengkap: string;
}

async function createAsprak(data: Asprak): Promise<string> {
  // implementation
}

// ❌ Bad
async function createAsprak(data: any) {
  // implementation
}
```

### React Components

- ✅ Use functional components
- ✅ Use hooks for state management
- ✅ Comment complex logic
- ✅ Extract reusable logic to custom hooks

```typescript
// ✅ Good
export function AsprakList() {
  const { asprak, loading, error } = useAsprak();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {asprak.map((a) => (
        <div key={a.id}>{a.nama_lengkap}</div>
      ))}
    </div>
  );
}

// ❌ Avoid
export class AsprakList extends React.Component {
  // old style class component
}
```

### Functions

- Keep functions small (< 50 lines typically)
- One responsibility per function
- Use descriptive names

```typescript
// ✅ Good
async function validateAsprakNim(nim: string, supabase: any): Promise<boolean> {
  const { data } = await supabase.from('asprak').select('id').eq('nim', nim).single();
  return !data;
}

// ❌ Bad
async function check(x: any, y: any): Promise<boolean> {
  // unclear what this does
}
```

### Naming Convention

```typescript
// Components (PascalCase)
export function AsprakTable() {}

// Functions (camelCase)
export async function createAsprak() {}

// Constants (UPPER_SNAKE_CASE)
export const MAX_ASPRAK_PER_PAGE = 20;

// Variables (camelCase)
const totalViolations = 5;

// Boolean variables (isX, hasX, canX pattern)
const isLoading = true;
const hasError = false;
const canDelete = true;
```

### Error Handling

```typescript
// ✅ Always handle errors
try {
  const result = await asprakService.createAsprak(data, supabase);
} catch (error) {
  logger.error('Failed to create asprak:', error);
  throw new Error('NIM sudah terdaftar');
}

// ❌ Never ignore errors
const result = await asprakService.createAsprak(data, supabase);
```

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Validate NIM before insertion to prevent duplicate entries
// because database constraint violations cause user confusion
const exists = await checkNimExists(nim);

// ❌ Bad: Obvious comments
// Get the asprak by ID
const asprak = await getAsprakById(id);
```

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Write Unit Tests

Create `.test.ts` files next to code:

```typescript
// utils/asprakCodeGenerator.test.ts
import { generateCode } from './asprakCodeGenerator';

describe('generateCode', () => {
  it('should generate code from name', () => {
    const code = generateCode('John Doe', '2024');
    expect(code).toMatch(/^JD2024\d+$/);
  });
});
```

---

## 🔍 Debugging

### Browser DevTools

1. Open browser inspector (F12)
2. Go to Console, Network, or Elements tabs
3. Check for errors or network issues

### VS Code Debugging

1. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

2. Set breakpoints and press F5 to debug

### Server Logs

Check logs in terminal where `npm run dev` is running.

### Logger Utility

```typescript
import { logger } from '@/lib/logger';

// Log levels
logger.error('Something went wrong:', error);
logger.warn('Warning: Low memory');
logger.info('User created:', userId);
logger.debug('Debug info:', data);
```

---

## 🐛 Common Issues

### Issue: "NEXT_PUBLIC_SUPABASE_URL not found"

**Solution**: Verify `.env.local` has correct values

```bash
cat .env.local
# Should show NEXT_PUBLIC_SUPABASE_URL=...
```

### Issue: "Module not found" error

**Solution**: Reinstall dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Solution**: Use different port

```bash
npm run dev -- -p 3001
```

### Issue: Database connection timeout

**Solution**: Check Supabase status

1. Visit https://status.supabase.com
2. Verify credentials in `.env.local`
3. Try: `npx tsx scripts/test_fetch.ts`

### Issue: Git merge conflicts

**Solution**: Resolve manually

```bash
# See conflicted files
git status

# Open file and resolve conflicts
# Then commit
git add .
git commit -m "fix: resolve merge conflicts"
```

---

## 🔗 Related Documents

- [Architecture Document](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated**: March 16, 2026  
**Maintained By**: Development Team  
**Questions?** See [Troubleshooting](./TROUBLESHOOTING.md) or contact team lead
