# Banking Application Context (`context.md`)

## Overview
This repository contains a **Cooperative Fund Management System** built with React, TypeScript, Vite, and Material UI. It manages member shares, peer lending with per-loan interest rates, flexible repayment options, interest pool distribution, and full transaction timeline logging.

---

## Tech Stack
- **Frontend Framework**: React 19
- **Build Tool**: Vite 8
- **Language**: TypeScript 6
- **UI Component Library**: Material UI (`@mui/material`, `@mui/icons-material`)
- **Styling**: Emotion (`@emotion/react`, `@emotion/styled`), Tailwind CSS
- **Routing**: React Router v7 (`react-router-dom`)
- **Utilities**: `date-fns` (date formatting), `uuid` (unique ID generation)
- **Visual Feedback & AI Debugging**: Agentation (`agentation` v3.0+)
- **Linting**: Oxlint

---

## Business Rules
1. **Capital = sum of member share deposits** — no manual capital injection
2. **Two member types**: `share` (pays monthly shares, can borrow, receives interest distributions) and `borrower` (borrow-only, no shares)
3. **Shares are returnable** — share members can withdraw equity not currently lent out
4. **Interest rate** is configurable globally in Settings, and can be **overridden per loan** at borrow time
5. **Repayment options**: Full (principal + interest), Partial (chosen principal + proportional interest), or Interest-only (no principal reduction)
6. **Interest collected** goes to a separate pool, distributed manually to share-members proportionally by their share percentage
7. **Every action is logged** as a Transaction with date, description, and full detail

---

## Project Structure
```
Banking/
├── context.md               # AI Agent & project context documentation (this file)
├── index.html               # Main HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # Base TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── src/
│   ├── main.tsx             # React DOM root render
│   ├── App.tsx              # Root component: routing, MUI theme, Agentation toolbar
│   ├── theme.ts             # Custom Material UI theme
│   ├── index.css            # Global CSS & Tailwind directives
│   ├── components/
│   │   └── Layout.tsx       # App shell: sidebar nav, app bar, bottom nav (mobile)
│   ├── pages/
│   │   ├── Dashboard.tsx    # Pool stats, interest pool, active loans count, top members, recent activity
│   │   ├── UsersList.tsx    # Members list with type badges, mobile, share %, equity
│   │   ├── AddUser.tsx      # Add member form: type toggle, name, mobile, monthly share
│   │   ├── UserDetails.tsx  # Member profile, stat cards, active loans table, repayment dialogs, timeline
│   │   └── Settings.tsx     # Interest rate config, fund overview, interest distribution, danger zone
│   └── services/
│       ├── types.ts         # Data models: User, Loan, Transaction, GlobalState, AppData, MemberType
│       └── store.ts         # LocalStorage persistence, business logic, migration
```

---

## Key Data Models (`src/services/types.ts`)
- **`MemberType`**: `'share'` | `'borrower'`
- **`User`**: `id`, `name`, `mobile`, `memberType`, `monthlyShareAmount`, `totalDeposited`, `totalLent`, `totalWithdrawn`, `interestEarned`
- **`Loan`**: `id`, `userId`, `principalAmount`, `outstandingPrincipal`, `interestRatePercent`, `totalInterestPaid`, `date`, `status`
- **`Transaction`**: `id`, `userId`, `loanId?`, `type`, `amount`, `date`, `description`, `interestPaid?`, `principalPaid?`
  - Types: `deposit`, `borrow`, `repay_full`, `repay_partial`, `interest_only`, `withdraw`, `interest_distribution`
- **`GlobalState`**: `totalLendingPool`, `totalInterestCollected`, `totalInterestDistributed`, `defaultInterestRatePercent`
- **`AppData`**: `users[]`, `loans[]`, `transactions[]`, `globalState`

---

## NPM Scripts
| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | TypeScript compilation + Vite production bundle |
| `npm run lint` | Lints with `oxlint` |
| `npm run preview` | Preview production build locally |
