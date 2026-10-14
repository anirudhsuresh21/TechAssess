# TechAssess — Online Assessment Platform for Tech Club Recruitment

> **A 100% Free, Production-Grade Online Assessment Platform designed for college Tech Club recruitment and induction examinations.**  
> Built with Next.js 14 (App Router), Express.js (TypeScript), MongoDB, and Tailwind CSS. Runs locally on any laptop with zero paid APIs, paid AI models, or paid hosting requirements.

---

## 🚀 Key Highlights

- **Zero-Paid Dependency:** Requires no paid LLMs, no paid proctoring services, and no paid hosting. Runs out of the box locally on Windows, macOS, or Linux.
- **Auto Fallback In-Memory MongoDB:** If an external MongoDB instance is not configured, the platform automatically initializes an embedded in-memory MongoDB instance for instant, zero-friction local execution.
- **5 Evaluation Pillars:** Numerical Aptitude, Logical Reasoning, Computer Fundamentals, Programming & Debugging, and Practical Problem Solving.
- **Authoritative Server Timing & Autosave:** Real-time debounced answer persistence to the server. Candidates can refresh their browser or reconnect without losing answers.
- **Immutable Assessment Snapshots:** Pinned versioning (`AssessmentVersion`) ensures active examination sessions are never corrupted by administrator edits.
- **Ethical Integrity Monitoring:** Transparent browser focus loss (Page Visibility API) and fullscreen monitoring with configurable warning limits and audit logging.
- **Automated Grading & Shortlisting:** Automated server-side scoring (positive marks, negative marking penalties, numerical tolerance, multi-select evaluation) with custom cutoff rules and CSV exports.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript, Zod, JWT, bcryptjs, Helmet, CORS, Rate-Limiting, Swagger/OpenAPI |
| **Database** | MongoDB with Mongoose ODM (Indexes, compound uniqueness, embedded in-memory fallback) |
| **Testing** | Vitest, Supertest, in-memory MongoDB integration test suite |
| **DevOps** | Docker, Docker Compose, npm workspaces monorepo |

---

## 📁 Repository Structure

```text
techassess/
├── apps/
│   ├── api/                     # Express.js REST API
│   │   ├── src/
│   │   │   ├── config/          # Environment & MongoDB connection (with in-memory fallback)
│   │   │   ├── middleware/      # Auth (JWT), RBAC, ErrorHandler, Zod validation, RateLimiters
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Admin login, sessions, /auth/me
│   │   │   │   ├── users/       # Super Admin and Assessment Admin models
│   │   │   │   ├── candidates/  # Registration without prior account, access code verification
│   │   │   │   ├── assessments/ # Examination wizard, sections, immutable versions
│   │   │   │   ├── questions/   # Question bank, CSV bulk import with row-level validation
│   │   │   │   ├── attempts/    # Examination sessions, autosave, question sanitization
│   │   │   │   ├── scoring/     # Server-side automated evaluation engine
│   │   │   │   ├── results/     # Rankings, Recharts analytics, CSV exports, manual review
│   │   │   │   ├── shortlisting/# Qualification cutoffs, recruiter notes, shortlist CSV
│   │   │   │   ├── integrity/   # Page visibility event recording, warning thresholds
│   │   │   │   ├── audit/       # Centralized administrative action audit logs
│   │   │   │   └── codeExecution/ # Isolated VM runner with strict timeouts & no fs/network
│   │   │   ├── scripts/         # create-admin.ts, seed.ts
│   │   │   ├── server.ts        # Server entry point
│   │   │   └── app.ts           # Express app setup & route registry
│   │   └── tests/               # 20 integration tests verifying end-to-end examination flows
│   └── web/                     # Next.js 14 App Router Frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx     # Landing page with examination code entry
│           │   ├── login/       # Admin login with demo quick-fill
│           │   ├── admin/       # Dashboard, Assessments, Questions, Results, Shortlist, Audit
│           │   └── exam/        # Candidate registration, instructions check, live exam, submitted
│           ├── components/      # UI components, Providers (QueryClient, AuthContext)
│           └── lib/             # API client with token management and utility helpers
├── packages/
│   └── shared/                  # TypeScript constants, enums, schemas, and shared types
├── docs/                        # Anti-cheating report & manual testing checklists
├── docker-compose.yml           # Multi-container orchestration (Mongo, API, Web)
├── .env.example                 # Example configuration
└── package.json                 # Monorepo workspaces configuration
```

---

## ⚡ Quickstart Guide (Local Development)

### 1. Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### 2. Clone & Install
```bash
cd TechAssess
npm install
```

### 3. Build Shared Package & Compile
```bash
npm run build
```

### 4. Seed Sample Examination Data
Populates a sample induction assessment (`MCA_RECRUIT_2026`), 12 curated questions across all 5 technical categories, administrator accounts, and candidate mock results:
```bash
npm run seed
```

### 5. Start Development Servers
Run both backend API and frontend concurrently:
```bash
npm run dev
```
- **Web Application:** `http://localhost:3000`
- **REST API:** `http://localhost:4000/api/v1`
- **Swagger Documentation:** `http://localhost:4000/api/docs`
- **API Health Check:** `http://localhost:4000/health`

---

## 🔑 Default Credentials & Sample Examination

| Role | Email / Access Code | Password | Purpose |
|---|---|---|---|
| **Super Administrator** | `admin@techassess.local` | `Admin@123456` | Full system control, assessment creation, audit logs |
| **Assessment Admin** | `recruiter@techassess.local` | `Admin@123456` | Question bank, candidate shortlisting, manual review |
| **Candidate Access Code** | `MCA_RECRUIT_2026` | *(None required)* | Enter directly on homepage to take the examination |

---

## 🐳 Running with Docker Compose

For a reproducible production or isolated container deployment:

```bash
docker-compose up --build
```
This boots:
1. `techassess-mongo`: Dedicated MongoDB 7.0 database container on port `27017`
2. `techassess-api`: Express API container on port `4000`
3. `techassess-web`: Next.js web application container on port `3000`

---

## 🧪 Running Automated Tests

Run the comprehensive integration test suite (20 automated workflow tests):
```bash
npm run test
```
The test suite validates:
- Administrator authentication, password hashing, and RBAC
- Single-choice and multiple-select question validation
- CSV bulk import parsing with row-level error reporting
- Assessment publishing and immutable snapshot creation
- Candidate registration without pre-existing accounts
- Question randomization and option order preservation
- Answer key sanitization (stripping answer keys from candidate payloads)
- Server-side answer autosaving and refresh session recovery
- Tab-switch focus loss recording and warning counts
- Server-authoritative submission and negative marking calculations
- Idempotent scoring preventing duplicate submissions
- Result ranking calculations, CSV export, and candidate shortlisting

---

## 📖 Administrative CLI Commands

### Create or Reset Super Administrator
```bash
npm run create-admin [email] [password] [name]
# Default: admin@techassess.local / Admin@123456
```

### Re-seed Database
```bash
npm run seed
```

---

## 🛡️ Anti-Cheating & Integrity Features

1. **Page Visibility Monitoring:** Tracks when candidate switches tabs or minimizes the window.
2. **Window Blur Detection:** Detects loss of focus to external desktop applications.
3. **Candidate Warning Thresholds:** Configurable threshold (default: 3) triggers visible candidate warnings and flags the attempt for administrator review.
4. **Authoritative Server Timer:** Server deadline calculation ensures candidate laptop clock alterations have zero effect on examination duration.
5. **Detailed Documentation:** Refer to [`docs/ANTI_CHEATING_LIMITATIONS.md`](./docs/ANTI_CHEATING_LIMITATIONS.md) for transparent analysis of browser sandboxing boundaries.

---

## 📋 Manual Testing Verification

Refer to [`docs/MANUAL_TESTING_CHECKLIST.md`](./docs/MANUAL_TESTING_CHECKLIST.md) for step-by-step verification instructions on laptops and browser environments.

---

## 📄 License

MIT License. Designed and built for College Tech Clubs & Universities.
