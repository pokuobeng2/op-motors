# OP Motors

Premium vehicle inventory and dealership management portal for OP Motors in Accra, Ghana.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev)
- **Bundler**: [Vite 8](https://vitejs.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + Radix UI primitives
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL, Row-Level Security, Auth, Storage)
- **State & Caching**: [TanStack Query](https://tanstack.com/query)

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v20+ recommended) or **Bun**

### 2. Environment Configuration
Verify your `.env` file contains your Supabase credentials:
```env
SUPABASE_PROJECT_ID="bnfxzhzqveczmyswoawu"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_nBwO9MlNLDb7r8I0bU-lXA_KB2-O8Mo"
SUPABASE_URL="https://bnfxzhzqveczmyswoawu.supabase.co"
VITE_SUPABASE_PROJECT_ID="bnfxzhzqveczmyswoawu"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_nBwO9MlNLDb7r8I0bU-lXA_KB2-O8Mo"
VITE_SUPABASE_URL="https://bnfxzhzqveczmyswoawu.supabase.co"
```

### 3. Install Dependencies
```bash
npm install
# or: bun install
```

### 4. Start Development Server
```bash
npm run dev
# or: bun run dev
```

The application will be accessible at `http://localhost:3000` (or `http://localhost:5173`).

### 5. Production Build
```bash
npm run build
npm run preview
```
